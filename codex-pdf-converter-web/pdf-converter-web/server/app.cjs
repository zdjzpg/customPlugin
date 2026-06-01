const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const multer = require('multer');

function createApp(dependencies) {
  const {
    authService,
    redemptionCodeService,
    codeRepository,
    sessionRepository,
    conversionRepository,
    conversionService,
    jsonLimit = '50mb',
    uploadTempDirectory = path.join(__dirname, '..', 'data', 'upload-temp')
  } = dependencies;

  const app = express();
  fs.mkdirSync(uploadTempDirectory, { recursive: true });
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_request, _file, callback) => {
        callback(null, uploadTempDirectory);
      },
      filename: (_request, file, callback) => {
        callback(null, buildUploadedFileName(decodeMultipartFileName(file.originalname)));
      }
    })
  });

  app.use(express.json({ limit: jsonLimit }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (_request, response) => {
    response.json({
      ok: true
    });
  });

  app.get('/api/admin/session', (request, response) => {
    const session = readAuthorizedSession(request, sessionRepository, 'admin');
    if (!session) {
      response.json({
        ok: true,
        authenticated: false,
        session: null
      });
      return;
    }

    response.json({
      ok: true,
      authenticated: true,
      session
    });
  });

  app.post('/api/admin/login', (request, response) => {
    const session = authService.loginAdmin(request.body || {});
    if (!session) {
      response.status(401).json({
        ok: false,
        reason: 'INVALID_CREDENTIALS'
      });
      return;
    }

    sessionRepository.save(session);
    setSessionCookie(response, session.token, session.expiresAt);

    response.json({
      ok: true,
      session: {
        role: session.role,
        expiresAt: session.expiresAt
      }
    });
  });

  app.get('/api/admin/codes', (request, response) => {
    const session = readAuthorizedSession(request, sessionRepository, 'admin');
    if (!session) {
      response.status(401).json({
        ok: false,
        reason: 'UNAUTHORIZED'
      });
      return;
    }

    response.json({
      ok: true,
      codes: codeRepository.list()
    });
  });

  app.post('/api/admin/codes', (request, response) => {
    const session = readAuthorizedSession(request, sessionRepository, 'admin');
    if (!session) {
      response.status(401).json({
        ok: false,
        reason: 'UNAUTHORIZED'
      });
      return;
    }

    const input = normalizeCodeInput(request.body || {});
    const createdCode = codeRepository.create(input);

    response.status(201).json({
      ok: true,
      code: createdCode
    });
  });

  app.patch('/api/admin/codes/:codeId/status', (request, response) => {
    const session = readAuthorizedSession(request, sessionRepository, 'admin');
    if (!session) {
      response.status(401).json({
        ok: false,
        reason: 'UNAUTHORIZED'
      });
      return;
    }

    const codeId = Number.parseInt(request.params.codeId, 10);
    const currentCode = codeRepository.findById(codeId);
    if (!currentCode) {
      response.status(404).json({
        ok: false,
        reason: 'CODE_NOT_FOUND'
      });
      return;
    }

    const nextStatus = request.body?.status === 'disabled' ? 'disabled' : 'active';
    const updatedCode = {
      ...currentCode,
      status: nextStatus
    };

    codeRepository.save(updatedCode);

    response.json({
      ok: true,
      code: updatedCode
    });
  });

  app.get('/api/buyer/session', (request, response) => {
    const session = readAuthorizedSession(request, sessionRepository, 'buyer');
    if (!session) {
      response.json({
        ok: true,
        authenticated: false,
        session: null
      });
      return;
    }

    response.json({
      ok: true,
      authenticated: true,
      session
    });
  });

  app.post('/api/buyer/login', (request, response) => {
    const code = typeof request.body?.code === 'string' ? request.body.code.trim() : '';
    const loginResult = redemptionCodeService.consumeForLogin(code);

    if (!loginResult.ok) {
      response.status(401).json(loginResult);
      return;
    }

    const session = authService.loginBuyer({
      codeId: loginResult.codeRecord.id,
      codeValue: loginResult.codeRecord.code
    });

    sessionRepository.save(session);
    setSessionCookie(response, session.token, session.expiresAt);

    response.json({
      ok: true,
      session: {
        role: session.role,
        expiresAt: session.expiresAt
      },
      code: {
        id: loginResult.codeRecord.id,
        code: loginResult.codeRecord.code,
        accessType: loginResult.codeRecord.accessType,
        remainingUses: loginResult.codeRecord.remainingUses,
        activatedAt: loginResult.codeRecord.activatedAt,
        expiresAt: loginResult.codeRecord.expiresAt
      }
    });
  });

  app.get('/api/conversions/catalog', (_request, response) => {
    response.json({
      ok: true,
      conversions: conversionService.getCatalog()
    });
  });

  app.post('/api/conversions/run', upload.array('files', 20), async (request, response) => {
    const session = readAuthorizedSession(request, sessionRepository, 'buyer');
    if (!session) {
      cleanupUploadedFiles(request.files);
      response.status(401).json({
        ok: false,
        reason: 'UNAUTHORIZED'
      });
      return;
    }

    const input = normalizeConversionRequest(request);
    if (!isValidConversionRequest(input)) {
      cleanupUploadedFiles(request.files);
      response.status(400).json({
        ok: false,
        reason: 'INVALID_CONVERSION_REQUEST'
      });
      return;
    }

    try {
      const result = await conversionService.runConversion({
        session,
        conversionKey: input.conversionKey,
        files: input.files
      });

      response.json({
        ok: true,
        conversion: {
          id: result.conversionId,
          status: result.status,
          files: result.files
        }
      });
    } catch (error) {
      response.status(error.statusCode || 500).json({
        ok: false,
        reason: error.reason || 'CONVERSION_FAILED',
        message: error.message
      });
    }
  });

  app.get('/admin', (_request, response) => {
    response.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
  });

  app.get('/api/admin/conversions', (request, response) => {
    const session = readAuthorizedSession(request, sessionRepository, 'admin');
    if (!session) {
      response.status(401).json({
        ok: false,
        reason: 'UNAUTHORIZED'
      });
      return;
    }

    response.json({
      ok: true,
      conversions: conversionRepository.listRecent()
    });
  });

  app.get('/api/downloads/conversions/:conversionId/:fileName', (request, response) => {
    const authorizedSession =
      readAuthorizedSession(request, sessionRepository, 'buyer') ||
      readAuthorizedSession(request, sessionRepository, 'admin');

    if (!authorizedSession) {
      response.status(401).json({
        ok: false,
        reason: 'UNAUTHORIZED'
      });
      return;
    }

    const conversionId = Number.parseInt(request.params.conversionId, 10);
    const conversion = conversionRepository.findById(conversionId);
    if (!conversion) {
      response.status(404).json({
        ok: false,
        reason: 'CONVERSION_NOT_FOUND'
      });
      return;
    }

    const matchedFile = conversion.outputFiles.find(
      (file) => file.fileName === request.params.fileName
    );

    if (!matchedFile) {
      response.status(404).json({
        ok: false,
        reason: 'FILE_NOT_FOUND'
      });
      return;
    }

    const absolutePath = path.join(__dirname, '..', 'data', matchedFile.relativePath);
    if (!fs.existsSync(absolutePath)) {
      response.status(404).json({
        ok: false,
        reason: 'FILE_MISSING_ON_DISK'
      });
      return;
    }

    response.download(absolutePath, matchedFile.fileName);
  });

  app.use((error, _request, response, next) => {
    if (!error) {
      next();
      return;
    }

    if (error.type === 'entity.too.large') {
      response.status(413).json({
        ok: false,
        reason: 'PAYLOAD_TOO_LARGE',
        message: '上传文件过大，请压缩文件后重试。'
      });
      return;
    }

    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      response.status(400).json({
        ok: false,
        reason: 'INVALID_JSON',
        message: '请求内容格式不正确，请重试。'
      });
      return;
    }

    next(error);
  });

  return app;
}

function readAuthorizedSession(request, sessionRepository, expectedRole) {
  const token = readSessionToken(request);
  if (!token) {
    return null;
  }

  const session = sessionRepository.findByToken(token);
  if (!session || session.role !== expectedRole) {
    return null;
  }

  if (new Date(session.expiresAt) <= new Date()) {
    return null;
  }

  return session;
}

function readSessionToken(request) {
  const cookieHeader = request.headers.cookie || '';
  const cookies = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const cookie of cookies) {
    if (cookie.startsWith('pdf_converter_session=')) {
      return cookie.slice('pdf_converter_session='.length);
    }
  }

  return null;
}

function setSessionCookie(response, token, expiresAt) {
  response.setHeader(
    'Set-Cookie',
    `pdf_converter_session=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`
  );
}

function normalizeCodeInput(input) {
  return {
    code: typeof input.code === 'string' ? input.code.trim() : '',
    accessType: input.accessType === 'duration' ? 'duration' : 'usage',
    maxUses: toNullableInteger(input.maxUses),
    durationDays: toNullableInteger(input.durationDays),
    note: typeof input.note === 'string' ? input.note.trim() : '',
    status: input.status === 'disabled' ? 'disabled' : 'active'
  };
}

function toNullableInteger(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeConversionRequest(input) {
  const request = input;
  const files = Array.isArray(request.files) && request.files.length > 0
    ? request.files.map((file) => ({
        fileName:
          typeof file?.originalname === 'string'
            ? decodeMultipartFileName(file.originalname).trim()
            : '',
        tempPath: file.path,
        sizeBytes: file.size
      }))
    : Array.isArray(request.body?.files)
      ? request.body.files.map((file) => ({
          fileName: typeof file?.fileName === 'string' ? file.fileName.trim() : '',
          contentBase64:
            typeof file?.contentBase64 === 'string' ? file.contentBase64.trim() : ''
        }))
      : [];

  return {
    conversionKey:
      typeof request.body?.conversionKey === 'string' ? request.body.conversionKey.trim() : '',
    files
  };
}

function isValidConversionRequest(input) {
  if (!input.conversionKey || input.files.length === 0) {
    return false;
  }

  return input.files.every((file) => file.fileName && (file.contentBase64 || file.tempPath));
}

function buildUploadedFileName(originalName) {
  const extension = path.extname(originalName || '');
  const baseName = path.basename(originalName || 'upload', extension);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const safeBaseName = baseName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim() || 'upload';
  return `${safeBaseName}-${timestamp}-${random}${extension}`;
}

function decodeMultipartFileName(value) {
  if (typeof value !== 'string') {
    return '';
  }

  try {
    const decoded = Buffer.from(value, 'latin1').toString('utf8');
    return decoded.includes('\uFFFD') ? value : decoded;
  } catch {
    return value;
  }
}

function cleanupUploadedFiles(files) {
  if (!Array.isArray(files)) {
    return;
  }

  for (const file of files) {
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
}

module.exports = {
  createApp
};
