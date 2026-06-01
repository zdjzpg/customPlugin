const crypto = require('crypto');
const { getPool } = require('./db');
const { hashPassword } = require('./auth');
const { generateShareCode } = require('../src/shared/shareCode');

async function columnExists(connection, databaseName, tableName, columnName) {
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [databaseName, tableName, columnName]
  );
  return rows.length > 0;
}

async function indexExists(connection, databaseName, tableName, indexName) {
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
      LIMIT 1
    `,
    [databaseName, tableName, indexName]
  );
  return rows.length > 0;
}

async function ensureSchema() {
  const pool = getPool();
  const connection = await pool.getConnection();
  const databaseName = process.env.DB_NAME || 'kids_english';

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL,
        password_hash VARCHAR(128) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'STAFF',
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_users_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        session_token VARCHAR(128) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_user_sessions_token (session_token),
        KEY idx_user_sessions_user (user_id),
        CONSTRAINT fk_user_sessions_user
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE
          ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    if (!(await columnExists(connection, databaseName, 'papers', 'owner_user_id'))) {
      await connection.query('ALTER TABLE papers ADD COLUMN owner_user_id BIGINT UNSIGNED NULL AFTER total_score');
    }

    if (!(await columnExists(connection, databaseName, 'papers', 'share_code'))) {
      await connection.query('ALTER TABLE papers ADD COLUMN share_code VARCHAR(6) NULL AFTER owner_user_id');
    }

    if (!(await columnExists(connection, databaseName, 'papers', 'reward_config_json'))) {
      await connection.query('ALTER TABLE papers ADD COLUMN reward_config_json LONGTEXT NULL AFTER share_code');
    }

    if (!(await columnExists(connection, databaseName, 'papers', 'comment_config_json'))) {
      await connection.query('ALTER TABLE papers ADD COLUMN comment_config_json LONGTEXT NULL AFTER reward_config_json');
    }

    if (!(await indexExists(connection, databaseName, 'papers', 'uk_papers_share_code'))) {
      await connection.query('ALTER TABLE papers ADD UNIQUE KEY uk_papers_share_code (share_code)');
    }

    if (!(await columnExists(connection, databaseName, 'submissions', 'owner_user_id'))) {
      await connection.query('ALTER TABLE submissions ADD COLUMN owner_user_id BIGINT UNSIGNED NULL AFTER paper_id');
    }

    if (!(await columnExists(connection, databaseName, 'submissions', 'reward_json'))) {
      await connection.query('ALTER TABLE submissions ADD COLUMN reward_json LONGTEXT NULL AFTER report_json');
    }

    if (!(await columnExists(connection, databaseName, 'submissions', 'student_school'))) {
      await connection.query('ALTER TABLE submissions ADD COLUMN student_school VARCHAR(255) NULL AFTER student_grade');
    }

    if (!(await columnExists(connection, databaseName, 'submissions', 'report_token'))) {
      await connection.query('ALTER TABLE submissions ADD COLUMN report_token VARCHAR(64) NULL AFTER report_json');
    }

    if (!(await indexExists(connection, databaseName, 'submissions', 'uk_submissions_report_token'))) {
      await connection.query('ALTER TABLE submissions ADD UNIQUE KEY uk_submissions_report_token (report_token)');
    }

    const adminHash = hashPassword('123456');
    await connection.query(
      `
        INSERT INTO users (username, password_hash, role, status)
        VALUES (?, ?, 'ADMIN', 'ACTIVE')
        ON DUPLICATE KEY UPDATE username = VALUES(username)
      `,
      ['admin', adminHash]
    );

    const [[adminUser]] = await connection.query('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminUser) {
      throw new Error('Failed to ensure default admin user.');
    }

    await connection.query('UPDATE papers SET owner_user_id = ? WHERE owner_user_id IS NULL', [adminUser.id]);
    const [paperRows] = await connection.query('SELECT id FROM papers WHERE share_code IS NULL OR share_code = ""');
    for (const paper of paperRows) {
      let shareCode = generateShareCode();
      let isUnique = false;
      while (!isUnique) {
        const [[existing]] = await connection.query('SELECT id FROM papers WHERE share_code = ? LIMIT 1', [shareCode]);
        if (!existing) {
          isUnique = true;
        } else {
          shareCode = generateShareCode();
        }
      }
      await connection.query('UPDATE papers SET share_code = ? WHERE id = ?', [shareCode, paper.id]);
    }
    await connection.query(
      `
        UPDATE submissions s
        INNER JOIN papers p ON p.id = s.paper_id
        SET s.owner_user_id = p.owner_user_id
        WHERE s.owner_user_id IS NULL
      `
    );

    const [tokenlessSubmissions] = await connection.query(
      'SELECT id FROM submissions WHERE report_token IS NULL OR report_token = ""'
    );
    for (const submission of tokenlessSubmissions) {
      await connection.query(
        'UPDATE submissions SET report_token = ? WHERE id = ?',
        [crypto.randomUUID().replace(/-/g, ''), submission.id]
      );
    }
  } finally {
    connection.release();
  }
}

module.exports = {
  ensureSchema
};
