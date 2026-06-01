const test = require('node:test');
const assert = require('node:assert/strict');

let tencentSoeService = null;
let paperRepository = null;

try {
  tencentSoeService = require('../server/tencentSoeService');
} catch (error) {
  tencentSoeService = null;
}

try {
  paperRepository = require('../server/paperRepository');
} catch (error) {
  paperRepository = null;
}

test('normalizeSoeSuggestedScore prefers Tencent suggested score and clamps the result', () => {
  assert.equal(typeof tencentSoeService?.normalizeSoeSuggestedScore, 'function');
  assert.equal(
    tencentSoeService.normalizeSoeSuggestedScore({
      SuggestedScore: 132,
      PronAccuracy: 66
    }),
    100
  );
  assert.equal(
    tencentSoeService.normalizeSoeSuggestedScore({
      SuggestedScore: -5,
      PronAccuracy: 66
    }),
    0
  );
  assert.equal(
    tencentSoeService.normalizeSoeSuggestedScore('{SuggestedScore:88.6, PronAccuracy:77}'),
    89
  );
});

test('relaxReadAloudScore softens low and mid-range Tencent scores', () => {
  assert.equal(typeof tencentSoeService?.relaxReadAloudScore, 'function');

  assert.equal(tencentSoeService.relaxReadAloudScore(0), 19);
  assert.equal(tencentSoeService.relaxReadAloudScore(30), 45);
  assert.equal(tencentSoeService.relaxReadAloudScore(45), 57);
  assert.equal(tencentSoeService.relaxReadAloudScore(60), 70);
  assert.equal(tencentSoeService.relaxReadAloudScore(75), 78);
  assert.equal(tencentSoeService.relaxReadAloudScore(89), 89);
  assert.equal(tencentSoeService.relaxReadAloudScore(95), 95);
});

test('relaxOralAnswerScore gives listen-answer questions a more generous curve', () => {
  assert.equal(typeof tencentSoeService?.relaxOralAnswerScore, 'function');

  assert.equal(tencentSoeService.relaxOralAnswerScore(0, 'listen_answer_question'), 28);
  assert.equal(tencentSoeService.relaxOralAnswerScore(30, 'listen_answer_question'), 51);
  assert.equal(tencentSoeService.relaxOralAnswerScore(45, 'listen_answer_question'), 63);
  assert.equal(tencentSoeService.relaxOralAnswerScore(75, 'listen_answer_question'), 82);
  assert.equal(
    tencentSoeService.relaxOralAnswerScore(45, 'listen_answer_question') >
      tencentSoeService.relaxOralAnswerScore(45, 'read_aloud'),
    true
  );
});

test('buildSoeRequestParams chooses eval mode from the reference text', () => {
  assert.equal(typeof tencentSoeService?.buildSoeRequestParams, 'function');

  assert.deepEqual(
    tencentSoeService.buildSoeRequestParams({
      appId: '1302603758',
      secretId: 'testSecretId',
      refText: 'banana',
      voiceId: 'voice-word',
      timestamp: 1722321759,
      expired: 1722408159,
      nonce: 42261112,
      scoreCoeff: 1
    }),
    {
      secretid: 'testSecretId',
      timestamp: 1722321759,
      expired: 1722408159,
      nonce: 42261112,
      server_engine_type: '16k_en',
      voice_format: 1,
      voice_id: 'voice-word',
      text_mode: 0,
      ref_text: 'banana',
      eval_mode: 0,
      score_coeff: 1,
      sentence_info_enabled: 1,
      rec_mode: 1
    }
  );

  assert.equal(
    tencentSoeService.buildSoeRequestParams({
      appId: '1302603758',
      secretId: 'testSecretId',
      refText: 'read this sentence',
      voiceId: 'voice-sentence',
      timestamp: 1722321759,
      expired: 1722408159,
      nonce: 42261112,
      scoreCoeff: 1
    }).eval_mode,
    1
  );
});

test('buildSoeWebsocketUrl signs the new-version request URL', () => {
  assert.equal(typeof tencentSoeService?.buildSoeWebsocketUrl, 'function');

  const url = tencentSoeService.buildSoeWebsocketUrl({
    appId: '1302603758',
    secretKey: 'testSecretKey',
    params: {
      eval_mode: 0,
      expired: 1722408159,
      nonce: 42261112,
      rec_mode: 1,
      ref_text: 'hello',
      score_coeff: 1.5,
      secretid: 'testSecretId',
      sentence_info_enabled: 1,
      server_engine_type: '16k_en',
      text_mode: 0,
      timestamp: 1722321759,
      voice_format: 1,
      voice_id: '4943511b-192c-40f8-b6c9-c3df2a827b75'
    }
  });

  assert.equal(
    url,
    'wss://soe.cloud.tencent.com/soe/api/1302603758?eval_mode=0&expired=1722408159&nonce=42261112&rec_mode=1&ref_text=hello&score_coeff=1.5&secretid=testSecretId&sentence_info_enabled=1&server_engine_type=16k_en&text_mode=0&timestamp=1722321759&voice_format=1&voice_id=4943511b-192c-40f8-b6c9-c3df2a827b75&signature=xsqstzrncuh%2Br7pNaDIrPGtrmGA%3D'
  );
});

test('scoreReadAloudAnswer falls back to score 100 when no usable audio can be scored', async () => {
  assert.equal(typeof tencentSoeService?.scoreReadAloudAnswer, 'function');

  const result = await tencentSoeService.scoreReadAloudAnswer({
    audioPath: '',
    refText: 'Read me aloud.'
  });

  assert.equal(result.rawScore, 100);
  assert.equal(result.fallbackUsed, true);
});

test('formatReadAloudScoreLog returns score or recognition error text for console output', () => {
  assert.equal(typeof tencentSoeService?.formatReadAloudScoreLog, 'function');

  assert.equal(
    tencentSoeService.formatReadAloudScoreLog({
      questionNumber: 3,
      scoringResult: { rawScore: 84, fallbackUsed: false }
    }),
    '��3�� 84��'
  );

  assert.equal(
    tencentSoeService.formatReadAloudScoreLog({
      questionNumber: 4,
      scoringResult: { rawScore: 100, fallbackUsed: true, reason: 'missing_credentials' }
    }),
    '��4�� ʶ�����missing_credentials��'
  );
});

test('buildSubmissionResultFromAnswerRows rebuilds the final report from stored answers', () => {
  assert.equal(typeof paperRepository?.buildSubmissionResultFromAnswerRows, 'function');

  const submission = paperRepository.buildSubmissionResultFromAnswerRows({
    student: { name: 'Tom' },
    paper: {
      commentConfig: {
        opening: 'Hello',
        closing: 'Bye',
        bands: [{ id: 'band_1', minScore: 20, text: 'Great job' }]
      }
    },
    answers: [
      {
        questionType: 'listen_choose_image',
        prompt: 'Pick the apple.',
        gainedScore: 10,
        totalScore: 10,
        answerStatus: 'PASS',
        studentAnswer: { studentText: 'apple' },
        correctAnswer: { correctText: 'apple' },
        question: { abilities: ['��'] }
      },
      {
        questionType: 'read_aloud',
        prompt: 'Read cat.',
        gainedScore: 16,
        totalScore: 20,
        answerStatus: 'PASS',
        studentAnswer: { studentText: 'cat', audioPath: 'records/demo.wav' },
        correctAnswer: { correctText: 'cat' },
        question: { abilities: ['˵'] }
      }
    ]
  });

  assert.equal(submission.report.total, 26);
  assert.equal(submission.report.totalPossible, 30);
  assert.equal(submission.report.percent, 87);
  assert.equal(submission.report.comments.middle, 'Great job');
  assert.equal(submission.report.details.length, 2);
});

test('paper repository marks all spoken question types for AI scoring and builds their reference text', () => {
  assert.equal(typeof paperRepository?.isAiScoredQuestionType, 'function');
  assert.equal(typeof paperRepository?.buildAiScoringReferenceText, 'function');

  assert.equal(paperRepository.isAiScoredQuestionType('read_aloud'), true);
  assert.equal(paperRepository.isAiScoredQuestionType('read_sentence_with_image'), true);
  assert.equal(paperRepository.isAiScoredQuestionType('listen_answer_question'), true);
  assert.equal(paperRepository.isAiScoredQuestionType('listen_choose_image'), false);

  assert.equal(
    paperRepository.buildAiScoringReferenceText({
      questionType: 'read_sentence_with_image',
      prompt: 'Read the sentence.',
      correctAnswer: { correctText: 'This is a rabbit.' },
      question: { sentenceText: 'This is a rabbit.' }
    }),
    'This is a rabbit.'
  );

  assert.equal(
    paperRepository.buildAiScoringReferenceText({
      questionType: 'listen_answer_question',
      prompt: 'Answer the question.',
      correctAnswer: { correctText: 'apple, red apple' },
      question: { answerKeywordsText: 'apple, red apple', questionText: 'What fruit do you like?' }
    }),
    'apple, red apple'
  );
});

test('formatSubmissionLog returns a general log line for every submission', () => {
  assert.equal(typeof paperRepository?.formatSubmissionLog, 'function');

  assert.equal(
    paperRepository.formatSubmissionLog({
      submissionId: 51,
      paperId: 12,
      student: { name: 'Tom' },
      records: [{}, {}, {}]
    }),
    '[Submission] id=51 paper=12 student="Tom" records=3'
  );

  assert.equal(
    paperRepository.formatSubmissionLog({
      submissionId: 52,
      paperId: '18',
      student: {},
      records: null
    }),
    '[Submission] id=52 paper=18 student="Unknown" records=0'
  );
});
