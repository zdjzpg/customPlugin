const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const { createApp } = require('./app.cjs');
const { createAuthService } = require('./services/authService.cjs');
const { createConversionService } = require('./services/conversionService.cjs');
const { createRedemptionCodeService } = require('./services/redemptionCodeService.cjs');

function bootstrapApplication(config) {
  const dataDirectory = path.join(__dirname, '..', 'data');
  const databasePath = path.join(dataDirectory, 'app.db');

  const database = new DatabaseSync(databasePath);
  initializeDatabase(database);

  const codeRepository = createSqliteCodeRepository(database);
  const sessionRepository = createSqliteSessionRepository(database);
  const conversionRepository = createSqliteConversionRepository(database);
  const usageStatsRepository = createSqliteUsageStatsRepository(database);

  seedCodesIfEmpty(codeRepository);

  const authService = createAuthService({
    adminUsername: config.adminUsername,
    adminPassword: config.adminPassword,
    adminSessionTtlMs: config.adminSessionTtlMs,
    buyerSessionTtlMs: config.buyerSessionTtlMs,
    randomIdFn: () => crypto.randomUUID()
  });

  const redemptionCodeService = createRedemptionCodeService({
    codeRepository
  });

  const conversionService = createConversionService({
    conversionRepository,
    storageRoot: path.join(__dirname, '..', 'data'),
    pythonBin: config.pythonBin,
    libreOfficeBin: config.libreOfficeBin,
    popplerBinDir: config.popplerBinDir,
    ghostscriptBin: config.ghostscriptBin,
    ocrmypdfBin: config.ocrmypdfBin
  });

  return createApp({
    authService,
    redemptionCodeService,
    codeRepository,
    sessionRepository,
    conversionRepository,
    conversionService,
    usageStatsRepository
  });
}

function initializeDatabase(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS redemption_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      access_type TEXT NOT NULL,
      max_uses INTEGER NULL,
      used_count INTEGER NOT NULL DEFAULT 0,
      duration_days INTEGER NULL,
      activated_at TEXT NULL,
      expires_at TEXT NULL,
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      code_id INTEGER NULL,
      code_value TEXT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_id INTEGER NULL,
      code_value TEXT NULL,
      conversion_key TEXT NOT NULL,
      input_file_names_json TEXT NOT NULL,
      output_files_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL,
      error_message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_id INTEGER NULL,
      code_value TEXT NULL,
      conversion_key TEXT NOT NULL,
      event_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function createSqliteCodeRepository(database) {
  const insertStatement = database.prepare(`
    INSERT INTO redemption_codes (
      code,
      access_type,
      max_uses,
      used_count,
      duration_days,
      activated_at,
      expires_at,
      note,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStatement = database.prepare(`
    UPDATE redemption_codes
    SET code = ?,
        access_type = ?,
        max_uses = ?,
        used_count = ?,
        duration_days = ?,
        activated_at = ?,
        expires_at = ?,
        note = ?,
        status = ?
    WHERE id = ?
  `);

  const listStatement = database.prepare(`
    SELECT
      id,
      code,
      access_type,
      max_uses,
      used_count,
      duration_days,
      activated_at,
      expires_at,
      note,
      status,
      created_at
    FROM redemption_codes
    ORDER BY id DESC
  `);

  const findByCodeStatement = database.prepare(`
    SELECT
      id,
      code,
      access_type,
      max_uses,
      used_count,
      duration_days,
      activated_at,
      expires_at,
      note,
      status,
      created_at
    FROM redemption_codes
    WHERE code = ?
  `);

  const countStatement = database.prepare('SELECT COUNT(1) AS total FROM redemption_codes');

  return {
    list() {
      return listStatement.all().map(mapCodeRow);
    },
    count() {
      return countStatement.get().total;
    },
    findByCode(code) {
      const row = findByCodeStatement.get(code);
      return row ? mapCodeRow(row) : null;
    },
    findById(codeId) {
      return this.list().find((record) => record.id === codeId) || null;
    },
    create(input) {
      const codeValue = input.code || generateHumanCode();
      const createdAt = new Date().toISOString();

      insertStatement.run(
        codeValue,
        input.accessType,
        input.maxUses,
        0,
        input.durationDays,
        null,
        null,
        input.note || '',
        input.status || 'active',
        createdAt
      );

      return this.findByCode(codeValue);
    },
    save(record) {
      updateStatement.run(
        record.code,
        record.accessType,
        record.maxUses,
        record.usedCount,
        record.durationDays,
        record.activatedAt,
        record.expiresAt,
        record.note || '',
        record.status,
        record.id
      );
    }
  };
}

function createSqliteSessionRepository(database) {
  const upsertStatement = database.prepare(`
    INSERT INTO sessions (
      token,
      role,
      code_id,
      code_value,
      expires_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET
      role = excluded.role,
      code_id = excluded.code_id,
      code_value = excluded.code_value,
      expires_at = excluded.expires_at
  `);

  const findByTokenStatement = database.prepare(`
    SELECT
      token,
      role,
      code_id,
      code_value,
      expires_at,
      created_at
    FROM sessions
    WHERE token = ?
  `);

  return {
    save(session) {
      upsertStatement.run(
        session.token,
        session.role,
        session.codeId || null,
        session.codeValue || null,
        session.expiresAt,
        new Date().toISOString()
      );
    },
    findByToken(token) {
      const row = findByTokenStatement.get(token);
      return row ? mapSessionRow(row) : null;
    }
  };
}

function createSqliteConversionRepository(database) {
  const insertStatement = database.prepare(`
    INSERT INTO conversions (
      code_id,
      code_value,
      conversion_key,
      input_file_names_json,
      output_files_json,
      status,
      error_message,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const markCompletedStatement = database.prepare(`
    UPDATE conversions
    SET output_files_json = ?,
        status = 'completed',
        error_message = '',
        updated_at = ?
    WHERE id = ?
  `);

  const markFailedStatement = database.prepare(`
    UPDATE conversions
    SET status = 'failed',
        error_message = ?,
        updated_at = ?
    WHERE id = ?
  `);

  const listRecentStatement = database.prepare(`
    SELECT
      id,
      code_id,
      code_value,
      conversion_key,
      input_file_names_json,
      output_files_json,
      status,
      error_message,
      created_at,
      updated_at
    FROM conversions
    ORDER BY id DESC
    LIMIT 100
  `);

  const findByIdStatement = database.prepare(`
    SELECT
      id,
      code_id,
      code_value,
      conversion_key,
      input_file_names_json,
      output_files_json,
      status,
      error_message,
      created_at,
      updated_at
    FROM conversions
    WHERE id = ?
  `);

  return {
    create(input) {
      const now = new Date().toISOString();
      const result = insertStatement.run(
        input.codeId,
        input.codeValue,
        input.conversionKey,
        JSON.stringify(input.inputFileNames || []),
        '[]',
        'running',
        '',
        now,
        now
      );

      return { id: Number(result.lastInsertRowid) };
    },
    markCompleted(id, outputFiles) {
      markCompletedStatement.run(JSON.stringify(outputFiles), new Date().toISOString(), id);
    },
    markFailed(id, errorMessage) {
      markFailedStatement.run(errorMessage || 'Unknown conversion error', new Date().toISOString(), id);
    },
    listRecent() {
      return listRecentStatement.all().map(mapConversionRow);
    },
    findById(id) {
      const row = findByIdStatement.get(id);
      return row ? mapConversionRow(row) : null;
    }
  };
}

function createSqliteUsageStatsRepository(database) {
  const insertStatement = database.prepare(`
    INSERT INTO usage_stats (
      code_id,
      code_value,
      conversion_key,
      event_type,
      created_at
    ) VALUES (?, ?, ?, ?, ?)
  `);

  return {
    recordConversionStart(input) {
      insertStatement.run(
        input.codeId || null,
        input.codeValue || null,
        input.conversionKey,
        'conversion_start',
        new Date().toISOString()
      );
    },
    listByDay(query) {
      const { dateFrom, dateTo } = resolveUsageStatsDateRange(query);
      const statement = database.prepare(`
        SELECT
          substr(created_at, 1, 10) AS day,
          conversion_key,
          COUNT(1) AS count
        FROM usage_stats
        WHERE event_type = 'conversion_start'
          AND substr(created_at, 1, 10) >= ?
          AND substr(created_at, 1, 10) <= ?
        GROUP BY substr(created_at, 1, 10), conversion_key
        ORDER BY day DESC, count DESC, conversion_key ASC
      `);

      return statement.all(dateFrom, dateTo).map((row) => ({
        day: row.day,
        conversionKey: row.conversion_key,
        count: row.count
      }));
    }
  };
}

function resolveUsageStatsDateRange(query) {
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  const preset = query?.preset || 'last7days';

  if (preset === 'today') {
    return {
      dateFrom: formatDateOnly(end),
      dateTo: formatDateOnly(end)
    };
  }

  if (preset === 'yesterday') {
    start.setUTCDate(start.getUTCDate() - 1);
    return {
      dateFrom: formatDateOnly(start),
      dateTo: formatDateOnly(start)
    };
  }

  if (preset === 'last30days') {
    start.setUTCDate(start.getUTCDate() - 29);
    return {
      dateFrom: formatDateOnly(start),
      dateTo: formatDateOnly(end)
    };
  }

  if (preset === 'custom' && query?.dateFrom && query?.dateTo) {
    return {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo
    };
  }

  start.setUTCDate(start.getUTCDate() - 6);
  return {
    dateFrom: formatDateOnly(start),
    dateTo: formatDateOnly(end)
  };
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function mapCodeRow(row) {
  return {
    id: row.id,
    code: row.code,
    accessType: row.access_type,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    durationDays: row.duration_days,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
    note: row.note,
    status: row.status,
    createdAt: row.created_at
  };
}

function mapSessionRow(row) {
  return {
    token: row.token,
    role: row.role,
    codeId: row.code_id,
    codeValue: row.code_value,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}

function mapConversionRow(row) {
  return {
    id: row.id,
    codeId: row.code_id,
    codeValue: row.code_value,
    conversionKey: row.conversion_key,
    inputFileNames: JSON.parse(row.input_file_names_json || '[]'),
    outputFiles: JSON.parse(row.output_files_json || '[]'),
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function generateHumanCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function seedCodesIfEmpty(codeRepository) {
  if (codeRepository.count() > 0) {
    return;
  }

  codeRepository.create({
    code: 'DEMO-USES-5',
    accessType: 'usage',
    maxUses: 5,
    durationDays: null,
    note: 'Demo usage card',
    status: 'active'
  });

  codeRepository.create({
    code: 'DEMO-DAYS-7',
    accessType: 'duration',
    maxUses: null,
    durationDays: 7,
    note: 'Demo duration card',
    status: 'active'
  });
}

module.exports = {
  bootstrapApplication
};
