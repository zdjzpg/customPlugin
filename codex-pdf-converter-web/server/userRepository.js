const { getPool } = require('./db');
const { createSessionToken, hashPassword, verifyPassword } = require('./auth');

function mapUser(row) {
  return {
    id: String(row.id),
    username: row.username,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getUserByUsername(username) {
  const pool = getPool();
  const [[row]] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return row || null;
}

async function createSession(userId) {
  const pool = getPool();
  const token = createSessionToken();
  await pool.query('INSERT INTO user_sessions (user_id, session_token) VALUES (?, ?)', [userId, token]);
  return token;
}

async function deleteSession(token) {
  const pool = getPool();
  await pool.query('DELETE FROM user_sessions WHERE session_token = ?', [token]);
}

async function getUserBySessionToken(token) {
  const pool = getPool();
  const [[row]] = await pool.query(
    `
      SELECT u.*
      FROM user_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ?
      LIMIT 1
    `,
    [token]
  );
  return row || null;
}

async function login(username, password) {
  const user = await getUserByUsername(username);
  if (!user || user.status !== 'ACTIVE' || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  const token = await createSession(user.id);
  return {
    token,
    user: mapUser(user)
  };
}

async function listUsers() {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM users ORDER BY role DESC, created_at ASC');
  return rows.map(mapUser);
}

async function createUser({ username, password, role = 'STAFF' }) {
  const pool = getPool();
  const [result] = await pool.query(
    `
      INSERT INTO users (username, password_hash, role, status)
      VALUES (?, ?, ?, 'ACTIVE')
    `,
    [username, hashPassword(password), role]
  );
  const [[row]] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
  return mapUser(row);
}

async function resetUserPassword(userId, password) {
  const pool = getPool();
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(password), userId]);
}

async function updateUserStatus(userId, status) {
  const pool = getPool();
  const [[user]] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
  if (user?.username === 'admin' && status !== 'ACTIVE') {
    const error = new Error('默认管理员账号不能被禁用');
    error.statusCode = 400;
    throw error;
  }
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
}

module.exports = {
  mapUser,
  login,
  deleteSession,
  getUserBySessionToken,
  listUsers,
  createUser,
  resetUserPassword,
  updateUserStatus
};
