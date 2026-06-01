const crypto = require('crypto');
const { getPool } = require('./db');
const studentValidation = require('../src/shared/studentValidation');
const paperValidation = require('../src/shared/paperValidation');
const paperEditPolicy = require('../src/shared/paperEditPolicy');
const questionAbilities = require('../src/shared/questionAbilities');
const questionDifficulty = require('../src/shared/questionDifficulty');
const studentExperience = require('../src/shared/studentExperience');
const reportComments = require('../src/shared/reportComments');
const reportAbilities = require('../src/shared/reportAbilities');
const followInstruction = require('../src/shared/followInstruction');
const questionTypeMeta = require('../src/shared/questionTypeMeta');
const { formatReadAloudScoreLog, scoreReadAloudAnswer } = require('./tencentSoeService');

const { getMissingStudentFields } = studentValidation;
const { getPaperScoreSummary } = paperValidation;
const { canEditPaper, getPaperEditBlockedMessage } = paperEditPolicy;
const { REPORT_ABILITIES, getDefaultAbilitiesForType, normalizeQuestionAbilities } = questionAbilities;
const { normalizeQuestionDifficulty } = questionDifficulty;
const { normalizeRewardConfig, pickRewardItem, validateRewardConfig } = studentExperience;
const { validateReportCommentConfig, resolveReportComments } = reportComments;
const { buildWeightedAbilityMap, toAbilityItems } = reportAbilities;
const { validateInstructionQuestion } = followInstruction;
const { getQuestionTypeLabel } = questionTypeMeta;
const AI_SCORED_QUESTION_TYPES = new Set(['read_aloud', 'read_sentence_with_image', 'listen_answer_question']);

function parseQuestionRow(row) {
  return {
    id: String(row.id),
    type: row.question_type,
    score: Number(row.score),
    prompt: row.prompt || ''
  };
}

function hydrateQuestion(row) {
  const base = parseQuestionRow(row);
  const content = typeof row.content_json === 'string'
    ? JSON.parse(row.content_json)
    : row.content_json;
  return { ...base, ...content };
}

function buildQuestionContent(question, content) {
  return {
    abilities: normalizeQuestionAbilities(question.abilities, getDefaultAbilitiesForType(question.type)),
    difficulty: normalizeQuestionDifficulty(question.difficulty),
    ...content
  };
}

function parseJsonValue(value, fallback = {}) {
  if (!value) {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }
  return value;
}

function toStudentStatus(answerStatus, gainedScore, totalScore) {
  if (answerStatus === 'PASS' || Number(gainedScore || 0) >= Number(totalScore || 0) * 0.7) {
    return '通过';
  }
  return '待加强';
}

function normalizeAnswerAbilities(answer) {
  const explicit = Array.isArray(answer.question?.abilities) ? answer.question.abilities.filter(Boolean) : [];
  if (explicit.length) {
    return explicit;
  }
  return getDefaultAbilitiesForType(answer.questionType);
}

function buildSubmissionResultFromAnswerRows({ student = {}, paper = {}, answers = [] }) {
  const records = answers.map((answer, index) => {
    const abilities = normalizeAnswerAbilities(answer);
    const studentText = String(answer.studentAnswer?.studentText || '').trim() || '未作答';
    const correctText = String(answer.correctAnswer?.correctText || '').trim() || '未配置';
    const gained = Number(answer.gainedScore || 0);
    const total = Number(answer.totalScore || 0);
    const status = toStudentStatus(answer.answerStatus, gained, total);

    return {
      index: index + 1,
      meta: {
        label: getQuestionTypeLabel(answer.questionType),
        type: answer.questionType,
        ability: abilities.join(' / ') || '-'
      },
      questionType: answer.questionType,
      prompt: answer.prompt || '',
      abilities,
      studentText,
      correctText,
      audioPath: answer.studentAnswer?.audioPath || '',
      audioUrl: answer.studentAnswer?.audioPath
        ? `/api/uploads/${String(answer.studentAnswer.audioPath).replace(/\\/g, '/')}`
        : '',
      audioMimeType: answer.studentAnswer?.audioMimeType || '',
      gained,
      total,
      status
    };
  });

  const abilityMap = buildWeightedAbilityMap(records);
  const total = records.reduce((sum, item) => sum + Number(item.gained || 0), 0);
  const totalPossible = records.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const comments = resolveReportComments(paper.commentConfig || {}, total);

  return {
    student,
    records,
    report: {
      total,
      totalPossible,
      percent: totalPossible ? Math.round((total / totalPossible) * 100) : 0,
      abilityMap,
      abilityItems: toAbilityItems(abilityMap, REPORT_ABILITIES),
      comments,
      details: records.map((record) => ({
        label: record.meta.label,
        gained: record.gained,
        total: record.total,
        status: record.status,
        note: `学生作答：${record.studentText}；标准答案：${record.correctText}`
      }))
    }
  };
}

function applyOwnerScope({ authUser, alias = 'p' }) {
  if (!authUser || authUser.role === 'ADMIN') {
    return { clause: '', params: [] };
  }
  return {
    clause: ` AND ${alias}.owner_user_id = ?`,
    params: [authUser.id]
  };
}

function normalizePaperListPagination({ page = 1, pageSize = 10 } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedPageSize = Math.max(1, Number.parseInt(pageSize, 10) || 10);
  const safePageSize = Math.min(parsedPageSize, 100);
  return {
    page: parsedPage,
    pageSize: safePageSize,
    offset: (parsedPage - 1) * safePageSize
  };
}

async function ensurePaperAccess(connection, paperId, authUser) {
  const [[paper]] = await connection.query('SELECT id, owner_user_id FROM papers WHERE id = ?', [paperId]);
  if (!paper) {
    return null;
  }
  if (authUser.role !== 'ADMIN' && String(paper.owner_user_id) !== String(authUser.id)) {
    const error = new Error('You do not have access to this paper.');
    error.statusCode = 403;
    throw error;
  }
  return paper;
}

function formatSubmissionLog({ submissionId, paperId, student = {}, records = [] } = {}) {
  const studentName = String(student?.name || '').trim() || 'Unknown';
  const recordCount = Array.isArray(records) ? records.length : 0;
  return `[Submission] id=${String(submissionId || '')} paper=${String(paperId || '')} student="${studentName}" records=${recordCount}`;
}

function isAiScoredQuestionType(questionType) {
  return AI_SCORED_QUESTION_TYPES.has(String(questionType || '').trim());
}

function buildAiScoringReferenceText({ questionType = '', correctAnswer = {}, question = {}, prompt = '' } = {}) {
  const normalizedType = String(questionType || '').trim();

  if (normalizedType === 'listen_answer_question') {
    return String(
      correctAnswer.correctText
        || question.answerKeywordsText
        || (Array.isArray(question.answerKeywords) ? question.answerKeywords.join(', ') : '')
        || question.questionText
        || prompt
        || ''
    ).trim();
  }

  if (normalizedType === 'read_sentence_with_image') {
    return String(
      correctAnswer.correctText
        || question.sentenceText
        || question.phrase
        || prompt
        || ''
    ).trim();
  }

  return String(
    correctAnswer.correctText
      || question.phrase
      || question.targetWord
      || question.answerWord
      || prompt
      || ''
  ).trim();
}

function normalizeQuestionPayload(question, index) {
  const base = {
    prompt: question.prompt || '',
    score: Number(question.score || 0)
  };

  if (question.type === 'listen_choose_image') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        choices: Array.isArray(question.choices) ? question.choices : [],
        correctChoiceId: question.correctChoiceId || '',
        answerWord: question.answerWord || question.answer || ''
      }))
    };
  }

  if (question.type === 'listen_follow_instruction') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        instructionText: question.instructionText || '',
        imageUrl: question.imageUrl || '',
        mode: question.mode || 'tap',
        draggableObject: question.draggableObject || {},
        targets: Array.isArray(question.targets) ? question.targets : [],
        correctTargetId: question.correctTargetId || '',
        autoPlay: question.autoPlay !== false
      }))
    };
  }

  if (question.type === 'look_choose_word') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        imageUrl: question.imageUrl || '',
        choices: Array.isArray(question.choices) ? question.choices : [],
        correctChoiceId: question.correctChoiceId || '',
        targetWord: question.targetWord || ''
      }))
    };
  }

  if (question.type === 'sentence_sort') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        sentence: question.sentence || ''
      }))
    };
  }

  if (question.type === 'read_aloud') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        phrase: question.phrase || '',
        mascotWord: question.mascotWord || ''
      }))
    };
  }

  if (question.type === 'listen_answer_question') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        questionText: question.questionText || '',
        answerKeywordsText: question.answerKeywordsText || '',
        minMatchCount: Number(question.minMatchCount || 1),
        autoPlay: question.autoPlay !== false
      }))
    };
  }

  if (question.type === 'listen_choose_letter') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        targetLetter: question.targetLetter || '',
        candidateLettersText: question.candidateLettersText || '',
        requireBothCases: question.requireBothCases === true,
        autoPlay: question.autoPlay !== false
      }))
    };
  }

  if (question.type === 'read_sentence_with_image') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        imageUrl: question.imageUrl || '',
        sentenceText: question.sentenceText || '',
        autoPlay: question.autoPlay === true
      }))
    };
  }

  if (question.type === 'match_image_word') {
    return {
      sortNo: index + 1,
      type: question.type,
      prompt: base.prompt,
      score: base.score,
      contentJson: JSON.stringify(buildQuestionContent(question, {
        pairs: Array.isArray(question.pairs) ? question.pairs : []
      }))
    };
  }

  return {
    sortNo: index + 1,
    type: question.type,
    prompt: base.prompt,
    score: base.score,
    contentJson: JSON.stringify(buildQuestionContent(question, {
      answerWord: question.answerWord || '',
      blankIndexesText: question.blankIndexesText || ''
    }))
  };
}

async function listPapers({ keyword = '', questionType = '', authUser, page = 1, pageSize = 10 } = {}) {
  const pool = getPool();
  const conditions = ['1 = 1'];
  const params = [];
  const ownerScope = applyOwnerScope({ authUser, alias: 'p' });
  const pagination = normalizePaperListPagination({ page, pageSize });

  if (keyword) {
    conditions.push('p.title LIKE ?');
    params.push(`%${keyword}%`);
  }

  if (questionType) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM paper_questions pqf
      WHERE pqf.paper_id = p.id
        AND pqf.question_type = ?
    )`);
    params.push(questionType);
  }

  if (ownerScope.clause) {
    conditions.push(ownerScope.clause.replace(/^ AND /, ''));
    params.push(...ownerScope.params);
  }

  const [[countRow]] = await pool.query(
    `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM papers p
      WHERE ${conditions.join(' AND ')}
    `,
    params
  );

  const [rows] = await pool.query(
    `
      SELECT
        p.id,
        p.title,
        p.theme_note,
        p.welcome_speech,
        p.question_count,
        p.total_score,
        p.status,
        p.updated_at,
        p.owner_user_id,
        p.share_code,
        u.username AS owner_username,
        GROUP_CONCAT(DISTINCT pq.question_type) AS question_types,
        COUNT(s.id) AS submission_count
      FROM papers p
      LEFT JOIN paper_questions pq ON pq.paper_id = p.id
      LEFT JOIN submissions s ON s.paper_id = p.id
      LEFT JOIN users u ON u.id = p.owner_user_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY
        p.id,
        p.title,
        p.theme_note,
        p.welcome_speech,
        p.question_count,
        p.total_score,
        p.status,
        p.updated_at,
        p.owner_user_id,
        p.share_code,
        u.username
      ORDER BY p.updated_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, pagination.pageSize, pagination.offset]
  );

  return {
    items: rows.map((row) => ({
      id: String(row.id),
      examTitle: row.title,
      themeNote: row.theme_note || '',
      welcomeSpeech: row.welcome_speech || '',
      questionTypes: String(row.question_types || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      questionCount: Number(row.question_count),
      totalScore: Number(row.total_score),
      updatedAt: row.updated_at,
      submissionCount: Number(row.submission_count),
      ownerUserId: row.owner_user_id ? String(row.owner_user_id) : '',
      ownerUsername: row.owner_username || '',
      shareCode: row.share_code || ''
    })),
    total: Number(countRow?.total || 0),
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

async function getPaperById(paperId) {
  const pool = getPool();
  const [[paper]] = await pool.query(
    `
      SELECT
        id,
        title,
        theme_note,
        welcome_speech,
        question_count,
        total_score,
        updated_at,
        owner_user_id,
        share_code,
        reward_config_json,
        comment_config_json,
        (
          SELECT COUNT(1)
          FROM submissions s
          WHERE s.paper_id = papers.id
        ) AS submission_count
      FROM papers
      WHERE id = ?
    `,
    [paperId]
  );

  if (!paper) {
    return null;
  }

  const [questionRows] = await pool.query(
    `
      SELECT
        id,
        sort_no,
        question_type,
        prompt,
        score,
        content_json
      FROM paper_questions
      WHERE paper_id = ?
      ORDER BY sort_no ASC
    `,
    [paperId]
  );

  return {
    id: String(paper.id),
    examTitle: paper.title,
    themeNote: paper.theme_note || '',
    welcomeSpeech: paper.welcome_speech || '',
    questionCount: Number(paper.question_count),
    totalScore: Number(paper.total_score),
    updatedAt: paper.updated_at,
    ownerUserId: paper.owner_user_id ? String(paper.owner_user_id) : '',
    shareCode: paper.share_code || '',
    rewardConfig: normalizeRewardConfig(
      typeof paper.reward_config_json === 'string' && paper.reward_config_json
        ? JSON.parse(paper.reward_config_json)
        : paper.reward_config_json || {}
    ),
    commentConfig: typeof paper.comment_config_json === 'string' && paper.comment_config_json
      ? JSON.parse(paper.comment_config_json)
      : paper.comment_config_json || {},
    submissionCount: Number(paper.submission_count || 0),
    questions: questionRows.map(hydrateQuestion)
  };
}

async function getPaperByShareCode(shareCode) {
  const pool = getPool();
  const [[row]] = await pool.query('SELECT id FROM papers WHERE share_code = ? LIMIT 1', [shareCode]);
  if (!row) {
    return null;
  }
  return getPaperById(row.id);
}

async function generateUniqueShareCode(connection) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const shareCode = String(Math.floor(100000 + Math.random() * 900000));
    const [[existing]] = await connection.query('SELECT id FROM papers WHERE share_code = ? LIMIT 1', [shareCode]);
    if (!existing) {
      return shareCode;
    }
  }
  throw new Error('Failed to generate unique share code.');
}

async function savePaper({ paperId = null, examTitle, themeNote, welcomeSpeech, rewardConfig = {}, commentConfig = {}, questions, authUser }) {
  const scoreSummary = getPaperScoreSummary(questions);
  if (!scoreSummary.isValid) {
    const error = new Error(scoreSummary.message);
    error.statusCode = 400;
    throw error;
  }
  const commentValidation = validateReportCommentConfig(commentConfig);
  if (!commentValidation.isValid) {
    const error = new Error(commentValidation.message);
    error.statusCode = 400;
    throw error;
  }
  const rewardValidation = validateRewardConfig(rewardConfig);
  if (!rewardValidation.isValid) {
    const error = new Error(rewardValidation.message);
    error.statusCode = 400;
    throw error;
  }
  for (let index = 0; index < questions.length; index += 1) {
    const instructionValidation = validateInstructionQuestion(questions[index], index);
    if (!instructionValidation.isValid) {
      const error = new Error(instructionValidation.message);
      error.statusCode = 400;
      throw error;
    }
  }

  const normalizedRewardConfig = normalizeRewardConfig(rewardConfig);
  const pool = getPool();
  const connection = await pool.getConnection();
  const questionCount = questions.length;
  const totalScore = scoreSummary.total;

  try {
    await connection.beginTransaction();

    let resolvedPaperId = paperId;
    let ownerUserId = String(authUser.id);

    if (paperId) {
      const existingPaper = await ensurePaperAccess(connection, paperId, authUser);
      if (!existingPaper) {
        const error = new Error('Paper not found');
        error.statusCode = 404;
        throw error;
      }
      const [[submissionRow]] = await connection.query(
        'SELECT COUNT(1) AS submission_count FROM submissions WHERE paper_id = ?',
        [paperId]
      );
      if (!canEditPaper({ submissionCount: Number(submissionRow?.submission_count || 0) })) {
        const error = new Error(getPaperEditBlockedMessage());
        error.statusCode = 400;
        throw error;
      }
      ownerUserId = String(existingPaper.owner_user_id);
      await connection.query(
        `
          UPDATE papers
          SET
            title = ?,
            theme_note = ?,
            welcome_speech = ?,
            question_count = ?,
            total_score = ?,
            owner_user_id = ?,
            reward_config_json = ?,
            comment_config_json = ?
          WHERE id = ?
        `,
        [examTitle, themeNote, welcomeSpeech, questionCount, totalScore, ownerUserId, JSON.stringify(normalizedRewardConfig), JSON.stringify(commentConfig || {}), paperId]
      );

      await connection.query('DELETE FROM paper_questions WHERE paper_id = ?', [paperId]);
    } else {
      const shareCode = await generateUniqueShareCode(connection);
      const [result] = await connection.query(
        `
          INSERT INTO papers (
            title,
            theme_note,
            welcome_speech,
            question_count,
            total_score,
            owner_user_id,
            share_code,
            reward_config_json,
            comment_config_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [examTitle, themeNote, welcomeSpeech, questionCount, totalScore, ownerUserId, shareCode, JSON.stringify(normalizedRewardConfig), JSON.stringify(commentConfig || {})]
      );
      resolvedPaperId = result.insertId;
    }

    for (let index = 0; index < questions.length; index += 1) {
      const item = normalizeQuestionPayload(questions[index], index);
      await connection.query(
        `
          INSERT INTO paper_questions (
            paper_id,
            sort_no,
            question_type,
            prompt,
            score,
            content_json
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [resolvedPaperId, item.sortNo, item.type, item.prompt, item.score, item.contentJson]
      );
    }

    await connection.commit();
    return getPaperById(resolvedPaperId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deletePaper(paperId, authUser) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const paper = await ensurePaperAccess(connection, paperId, authUser);
    if (!paper) {
      const error = new Error('Paper not found');
      error.statusCode = 404;
      throw error;
    }
    await connection.query('DELETE FROM papers WHERE id = ?', [paperId]);
  } finally {
    connection.release();
  }
}

async function copyPaper(paperId, authUser) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const paper = await ensurePaperAccess(connection, paperId, authUser);
    if (!paper) {
      return null;
    }
  } finally {
    connection.release();
  }

  const sourcePaper = await getPaperById(paperId);
  if (!sourcePaper) {
    return null;
  }

  return savePaper({
    examTitle: `${sourcePaper.examTitle} - 复制`,
    themeNote: sourcePaper.themeNote,
    welcomeSpeech: sourcePaper.welcomeSpeech,
    rewardConfig: sourcePaper.rewardConfig,
    commentConfig: sourcePaper.commentConfig,
    questions: sourcePaper.questions,
    authUser
  });
}

async function saveSubmission({
  paperId,
  student,
  report,
  records
}) {
  const missingFields = getMissingStudentFields(student);
  if (missingFields.length) {
    const error = new Error(`Missing required student fields: ${missingFields.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[paper]] = await connection.query(
      'SELECT owner_user_id, comment_config_json FROM papers WHERE id = ?',
      [paperId]
    );
    if (!paper) {
      const error = new Error('Paper not found');
      error.statusCode = 404;
      throw error;
    }

    const reportToken = crypto.randomUUID().replace(/-/g, '');
    const [submissionResult] = await connection.query(
      `
        INSERT INTO submissions (
          paper_id,
          owner_user_id,
          student_name,
          student_phone,
          student_age,
          student_grade,
          student_school,
          total_score,
          total_possible_score,
          percent_score,
          report_json,
          report_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        paperId,
        paper.owner_user_id,
        student.name || '',
        student.phone || '',
        student.age || '',
        student.grade || '',
        student.school || '',
        0,
        0,
        0,
        JSON.stringify({}),
        reportToken
      ]
    );

    const submissionId = submissionResult.insertId;
    console.log(formatSubmissionLog({ submissionId, paperId, student, records }));

    const [questionRows] = await connection.query(
      `
        SELECT id, sort_no, question_type, prompt, score, content_json
        FROM paper_questions
        WHERE paper_id = ?
        ORDER BY sort_no ASC
      `,
      [paperId]
    );

    const hydratedQuestionRows = questionRows.map(hydrateQuestion);
    const storedAnswers = [];

    for (let index = 0; index < hydratedQuestionRows.length; index += 1) {
      const questionRow = hydratedQuestionRows[index];
      const sourceQuestionRow = questionRows[index];
      const record = records[index] || {};
      const studentAnswer = {
        studentText: record.studentText || '',
        audioPath: record.audioPath || '',
        audioMimeType: record.audioMimeType || ''
      };
      const correctAnswer = {
        correctText: record.correctText || questionRow.phrase || questionRow.targetWord || questionRow.answerWord || ''
      };
      const gainedScore = Number(record.gained || 0);
      const totalScore = Number(record.total || questionRow.score || 0);
      const answerStatus = record.status === '通过' ? 'PASS' : 'WARN';
      const [answerResult] = await connection.query(
        `
          INSERT INTO submission_answers (
            submission_id,
            paper_question_id,
            sort_no,
            question_type,
            prompt,
            student_answer_json,
            correct_answer_json,
            gained_score,
            total_score,
            answer_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          submissionId,
          questionRow.id,
          sourceQuestionRow.sort_no,
          questionRow.type,
          questionRow.prompt,
          JSON.stringify(studentAnswer),
          JSON.stringify(correctAnswer),
          gainedScore,
          totalScore,
          answerStatus
        ]
      );

      storedAnswers.push({
        id: answerResult.insertId,
        questionNumber: Number(sourceQuestionRow.sort_no || index + 1),
        questionType: questionRow.type,
        prompt: questionRow.prompt,
        gainedScore,
        totalScore,
        answerStatus,
        studentAnswer,
        correctAnswer,
        question: questionRow
      });
    }

    for (const answer of storedAnswers) {
      if (!isAiScoredQuestionType(answer.questionType)) {
        continue;
      }

      const scoringResult = await scoreReadAloudAnswer({
        audioPath: answer.studentAnswer.audioPath || '',
        refText: buildAiScoringReferenceText(answer),
        questionType: answer.questionType
      });
      console.log(`[Tencent SOE] submission ${submissionId} ${formatReadAloudScoreLog({
        questionNumber: answer.questionNumber,
        scoringResult
      })}`);
      const gainedScore = Math.round((Number(scoringResult.rawScore || 0) / 100) * Number(answer.totalScore || 0));
      const answerStatus = gainedScore >= Number(answer.totalScore || 0) * 0.7 ? 'PASS' : 'WARN';

      answer.studentAnswer = {
        ...answer.studentAnswer,
        rawScore: Number(scoringResult.rawScore || 0),
        fallbackUsed: scoringResult.fallbackUsed === true
      };
      answer.gainedScore = gainedScore;
      answer.answerStatus = answerStatus;

      await connection.query(
        `
          UPDATE submission_answers
          SET student_answer_json = ?, gained_score = ?, answer_status = ?
          WHERE id = ?
        `,
        [
          JSON.stringify(answer.studentAnswer),
          gainedScore,
          answerStatus,
          answer.id
        ]
      );
    }

    const finalSubmission = buildSubmissionResultFromAnswerRows({
      student,
      paper: {
        commentConfig: parseJsonValue(paper.comment_config_json, {})
      },
      answers: storedAnswers
    });

    await connection.query(
      `
        UPDATE submissions
        SET total_score = ?, total_possible_score = ?, percent_score = ?, report_json = ?
        WHERE id = ?
      `,
      [
        Number(finalSubmission.report.total || 0),
        Number(finalSubmission.report.totalPossible || 0),
        Number(finalSubmission.report.percent || 0),
        JSON.stringify(finalSubmission.report),
        submissionId
      ]
    );

    await connection.commit();
    return { id: String(submissionId), reportToken, reward: null, report: finalSubmission.report };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getSubmissionReportByToken(shareCode, reportToken) {
  const normalizedShareCode = String(shareCode || '').trim();
  const normalizedReportToken = String(reportToken || '').trim();
  if (!normalizedShareCode || !normalizedReportToken) {
    return null;
  }

  const pool = getPool();
  const [[row]] = await pool.query(
    `
      SELECT
        s.id,
        s.paper_id,
        s.student_name,
        s.student_phone,
        s.student_age,
        s.student_grade,
        s.student_school,
        s.total_score,
        s.total_possible_score,
        s.percent_score,
        s.report_json,
        s.reward_json,
        s.report_token
      FROM submissions s
      INNER JOIN papers p ON p.id = s.paper_id
      WHERE p.share_code = ? AND s.report_token = ?
      LIMIT 1
    `,
    [normalizedShareCode, normalizedReportToken]
  );

  if (!row) {
    return null;
  }

  const paper = await getPaperById(row.paper_id);
  if (!paper || paper.shareCode !== normalizedShareCode) {
    return null;
  }

  const reportData = parseJsonValue(row.report_json, {});
  return {
    id: String(row.id),
    reportToken: row.report_token || normalizedReportToken,
    student: {
      name: row.student_name || '',
      phone: row.student_phone || '',
      age: row.student_age || '',
      grade: row.student_grade || '',
      school: row.student_school || ''
    },
    report: {
      total: Number(row.total_score || 0),
      totalPossible: Number(row.total_possible_score || 0),
      percent: Number(row.percent_score || 0),
      abilityMap: reportData.abilityMap || {},
      abilityItems: Array.isArray(reportData.abilityItems) ? reportData.abilityItems : [],
      comments: reportData.comments || {},
      details: Array.isArray(reportData.details) ? reportData.details : []
    },
    reward: parseJsonValue(row.reward_json, null),
    paper
  };
}

async function listSubmissionsByPaper(paperId, studentKeyword = '', authUser) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const paper = await ensurePaperAccess(connection, paperId, authUser);
    if (!paper) {
      return [];
    }

    const params = [paperId];
    let keywordClause = '';

    if (studentKeyword) {
      keywordClause = `
        AND (
          s.student_name LIKE ?
          OR s.student_phone LIKE ?
        )
      `;
      params.push(`%${studentKeyword}%`, `%${studentKeyword}%`);
    }

    const [submissionRows] = await connection.query(
      `
        SELECT
          s.id,
          s.paper_id,
          p.title AS paper_title,
              s.student_name,
              s.student_phone,
              s.student_age,
              s.student_grade,
              s.student_school,
              s.total_score,
              s.total_possible_score,
              s.percent_score,
          s.report_json,
          s.submitted_at,
          s.reward_json
        FROM submissions s
        INNER JOIN papers p ON p.id = s.paper_id
        WHERE s.paper_id = ?
        ${keywordClause}
        ORDER BY s.submitted_at DESC
      `,
      params
    );

    if (!submissionRows.length) {
      return [];
    }

    const submissionIds = submissionRows.map((item) => item.id);
    const [answerRows] = await connection.query(
      `
        SELECT
          submission_id,
          sort_no,
          question_type,
          prompt,
          student_answer_json,
          correct_answer_json,
          gained_score,
          total_score,
          answer_status
        FROM submission_answers
        WHERE submission_id IN (${submissionIds.map(() => '?').join(', ')})
        ORDER BY submission_id ASC, sort_no ASC
      `,
      submissionIds
    );

    return submissionRows.map((row) => {
      const reportData = parseJsonValue(row.report_json, {});
      const records = answerRows
        .filter((answer) => answer.submission_id === row.id)
        .map((answer) => {
          const studentAnswer = typeof answer.student_answer_json === 'string'
            ? JSON.parse(answer.student_answer_json)
            : answer.student_answer_json;
          const correctAnswer = typeof answer.correct_answer_json === 'string'
            ? JSON.parse(answer.correct_answer_json)
            : answer.correct_answer_json;

          return {
            index: Number(answer.sort_no),
            meta: { label: getQuestionTypeLabel(answer.question_type) },
            prompt: answer.prompt || '',
            studentText: studentAnswer?.studentText || '',
            audioPath: studentAnswer?.audioPath || '',
            audioUrl: studentAnswer?.audioPath ? `/api/uploads/${String(studentAnswer.audioPath).replace(/\\/g, '/')}` : '',
            audioMimeType: studentAnswer?.audioMimeType || '',
            correctText: correctAnswer?.correctText || '',
            gained: Number(answer.gained_score),
            total: Number(answer.total_score),
            status: answer.answer_status === 'PASS' ? '通过' : '待加强'
          };
        });

      return {
        id: String(row.id),
        paperId: String(row.paper_id),
        paperTitle: row.paper_title,
            student: {
              name: row.student_name || '',
              phone: row.student_phone || '',
              age: row.student_age || '',
              grade: row.student_grade || '',
              school: row.student_school || ''
            },
        submittedAt: row.submitted_at,
        report: {
          total: Number(row.total_score),
          totalPossible: Number(row.total_possible_score),
          percent: Number(row.percent_score),
          abilityMap: reportData.abilityMap || {},
          abilityItems: Array.isArray(reportData.abilityItems) ? reportData.abilityItems : [],
          comments: reportData.comments || {},
          details: Array.isArray(reportData.details) ? reportData.details : []
        },
        reward: typeof row.reward_json === 'string' && row.reward_json ? JSON.parse(row.reward_json) : null,
        records
      };
    });
  } finally {
    connection.release();
  }
}

async function drawRewardForSubmission(submissionId) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    const [[row]] = await connection.query(
      `
        SELECT
          s.id,
          s.reward_json,
          p.reward_config_json
        FROM submissions s
        INNER JOIN papers p ON p.id = s.paper_id
        WHERE s.id = ?
        LIMIT 1
      `,
      [submissionId]
    );

    if (!row) {
      const error = new Error('Submission not found');
      error.statusCode = 404;
      throw error;
    }

    if (row.reward_json) {
      const reward = typeof row.reward_json === 'string' ? JSON.parse(row.reward_json) : row.reward_json;
      return { submissionId: String(row.id), reward, alreadyDrawn: true };
    }

    const rewardConfig = normalizeRewardConfig(
      typeof row.reward_config_json === 'string' && row.reward_config_json
        ? JSON.parse(row.reward_config_json)
        : row.reward_config_json || {}
    );

    if (!rewardConfig.enabled || !rewardConfig.items.length) {
      return { submissionId: String(row.id), reward: null, alreadyDrawn: false };
    }

    const reward = pickRewardItem(rewardConfig, Math.random());
    await connection.query(
      'UPDATE submissions SET reward_json = ? WHERE id = ?',
      [JSON.stringify(reward), submissionId]
    );

    return { submissionId: String(row.id), reward, alreadyDrawn: false };
  } finally {
    connection.release();
  }
}

module.exports = {
  listPapers,
  getPaperById,
  getPaperByShareCode,
  getSubmissionReportByToken,
  savePaper,
  deletePaper,
  copyPaper,
  saveSubmission,
  listSubmissionsByPaper,
  drawRewardForSubmission,
  buildSubmissionResultFromAnswerRows,
  formatSubmissionLog,
  isAiScoredQuestionType,
  buildAiScoringReferenceText
};
