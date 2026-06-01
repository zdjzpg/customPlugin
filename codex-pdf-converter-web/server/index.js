require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const {
  listPapers,
  getPaperById,
  getPaperByShareCode,
  getSubmissionReportByToken,
  savePaper,
  deletePaper,
  copyPaper,
  saveSubmission,
  listSubmissionsByPaper,
  drawRewardForSubmission
} = require('./paperRepository');
const {
  login,
  deleteSession,
  getUserBySessionToken,
  listUsers,
  createUser,
  resetUserPassword,
  updateUserStatus
} = require('./userRepository');
const { getPool } = require('./db');
const { ensureSchema } = require('./schema');
const { saveAnswerAudio } = require('./uploadRepository');
const { getOrCreateTtsAudioFile } = require('./tencentTtsService');

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use('/api/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' && token ? token : '';
}

async function loadAuthUser(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    req.authUser = null;
    req.authToken = '';
    next();
    return;
  }

  try {
    const user = await getUserBySessionToken(token);
    req.authUser = user && user.status === 'ACTIVE'
      ? {
          id: String(user.id),
          username: user.username,
          role: user.role,
          status: user.status
        }
      : null;
    req.authToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.authUser) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.authUser) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (req.authUser.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
}

function handleError(res, error) {
  if (error.code === 'ER_DUP_ENTRY') {
    res.status(400).json({ message: '账号已存在，请换一个账号名。' });
    return;
  }
  res.status(error.statusCode || 500).json({ message: error.message });
}

app.use(loadAuthUser);

app.get('/api/health', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/tts', async (req, res) => {
  try {
    const result = await getOrCreateTtsAudioFile({
      text: req.query.text || ''
    });
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(result.absolutePath);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await login((req.body.username || '').trim(), req.body.password || '');
    if (!result) {
      res.status(401).json({ message: '账号或密码错误' });
      return;
    }
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  res.json({ user: req.authUser });
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    await deleteSession(req.authToken);
    res.status(204).end();
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const items = await listUsers();
    res.json({ items });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/users', requireAdmin, async (req, res) => {
  try {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    const role = req.body.role === 'ADMIN' ? 'ADMIN' : 'STAFF';
    if (!username || !password) {
      res.status(400).json({ message: '账号和密码必填' });
      return;
    }
    const user = await createUser({ username, password, role });
    res.status(201).json(user);
  } catch (error) {
    handleError(res, error);
  }
});

app.patch('/api/users/:userId/password', requireAdmin, async (req, res) => {
  try {
    const password = req.body.password || '';
    if (!password) {
      res.status(400).json({ message: '新密码必填' });
      return;
    }
    await resetUserPassword(req.params.userId, password);
    res.status(204).end();
  } catch (error) {
    handleError(res, error);
  }
});

app.patch('/api/users/:userId/status', requireAdmin, async (req, res) => {
  try {
    const status = req.body.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE';
    await updateUserStatus(req.params.userId, status);
    res.status(204).end();
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/papers', requireAuth, async (req, res) => {
  try {
    const papers = await listPapers({
      keyword: req.query.keyword || '',
      questionType: req.query.questionType || '',
      page: req.query.page,
      pageSize: req.query.pageSize,
      authUser: req.authUser
    });
    res.json(papers);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/public/papers/:paperId', async (req, res) => {
  try {
    const paper = await getPaperById(req.params.paperId);
    if (!paper) {
      res.status(404).json({ message: 'Paper not found' });
      return;
    }
    res.json(paper);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/public/papers/code/:shareCode', async (req, res) => {
  try {
    const paper = await getPaperByShareCode(req.params.shareCode);
    if (!paper) {
      res.status(404).json({ message: 'Paper not found' });
      return;
    }
    res.json(paper);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/public/papers/code/:shareCode/reports/:reportToken', async (req, res) => {
  try {
    const submission = await getSubmissionReportByToken(req.params.shareCode, req.params.reportToken);
    if (!submission) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }
    res.json(submission);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/papers/:paperId', requireAuth, async (req, res) => {
  try {
    const paper = await getPaperById(req.params.paperId);
    if (!paper) {
      res.status(404).json({ message: 'Paper not found' });
      return;
    }
    if (req.authUser.role !== 'ADMIN' && paper.ownerUserId !== String(req.authUser.id)) {
      res.status(403).json({ message: 'You do not have access to this paper.' });
      return;
    }
    res.json(paper);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/papers', requireAuth, async (req, res) => {
  try {
    const saved = await savePaper({ ...req.body, authUser: req.authUser });
    res.status(201).json(saved);
  } catch (error) {
    handleError(res, error);
  }
});

app.put('/api/papers/:paperId', requireAuth, async (req, res) => {
  try {
    const saved = await savePaper({
      ...req.body,
      paperId: req.params.paperId,
      authUser: req.authUser
    });
    res.json(saved);
  } catch (error) {
    handleError(res, error);
  }
});

app.delete('/api/papers/:paperId', requireAuth, async (req, res) => {
  try {
    await deletePaper(req.params.paperId, req.authUser);
    res.status(204).end();
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/papers/:paperId/copy', requireAuth, async (req, res) => {
  try {
    const copied = await copyPaper(req.params.paperId, req.authUser);
    if (!copied) {
      res.status(404).json({ message: 'Paper not found' });
      return;
    }
    res.status(201).json(copied);
  } catch (error) {
    handleError(res, error);
  }
});

app.get('/api/papers/:paperId/submissions', requireAuth, async (req, res) => {
  try {
    const items = await listSubmissionsByPaper(
      req.params.paperId,
      req.query.studentKeyword || '',
      req.authUser
    );
    res.json({ items });
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/uploads/answer-audio', express.raw({ type: '*/*', limit: '25mb' }), async (req, res) => {
  try {
    const result = await saveAnswerAudio({
      buffer: req.body,
      mimeType: req.headers['content-type'] || '',
      questionId: req.query.questionId || '',
      questionType: req.query.questionType || ''
    });
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/papers/:paperId/submissions', async (req, res) => {
  try {
    const submission = await saveSubmission({
      paperId: req.params.paperId,
      student: req.body.student || {},
      report: req.body.report || {},
      records: req.body.records || []
    });
    res.status(201).json(submission);
  } catch (error) {
    handleError(res, error);
  }
});

app.post('/api/submissions/:submissionId/reward-draw', async (req, res) => {
  try {
    const result = await drawRewardForSubmission(req.params.submissionId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

(async () => {
  try {
    await ensureSchema();
    app.listen(port, () => {
      console.log(`API server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
})();
