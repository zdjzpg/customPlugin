const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function withMockedRepository(queryImpl) {
  const dbPath = require.resolve('../server/db');
  const repositoryPath = require.resolve('../server/paperRepository');
  const originalDbModule = require.cache[dbPath];
  const originalRepositoryModule = require.cache[repositoryPath];

  delete require.cache[repositoryPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      getPool() {
        return { query: queryImpl };
      }
    }
  };

  const repository = require('../server/paperRepository');

  function restore() {
    delete require.cache[repositoryPath];
    if (originalRepositoryModule) {
      require.cache[repositoryPath] = originalRepositoryModule;
    }
    if (originalDbModule) {
      require.cache[dbPath] = originalDbModule;
    } else {
      delete require.cache[dbPath];
    }
  }

  return { repository, restore };
}

test('listPapers returns paginated items with total and applies limit/offset', async () => {
  const calls = [];
  const { repository, restore } = withMockedRepository(async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes('COUNT(DISTINCT p.id) AS total')) {
      return [[{ total: 23 }]];
    }
    return [[
      {
        id: 15,
        title: '动物卷',
        theme_note: '主题',
        welcome_speech: '欢迎',
        question_count: 8,
        total_score: 100,
        updated_at: '2026-04-17 12:00:00',
        owner_user_id: 7,
        owner_username: 'alice',
        share_code: '123456',
        question_types: 'listen_answer_question,read_aloud',
        submission_count: 3
      }
    ]];
  });

  try {
    const result = await repository.listPapers({
      keyword: '动物',
      questionType: 'read_aloud',
      authUser: { id: '7', role: 'STAFF' },
      page: 2,
      pageSize: 10
    });

    assert.deepEqual(result, {
      items: [
        {
          id: '15',
          examTitle: '动物卷',
          themeNote: '主题',
          welcomeSpeech: '欢迎',
          questionCount: 8,
          totalScore: 100,
          updatedAt: '2026-04-17 12:00:00',
          submissionCount: 3,
          ownerUserId: '7',
          ownerUsername: 'alice',
          shareCode: '123456',
          questionTypes: ['listen_answer_question', 'read_aloud']
        }
      ],
      total: 23,
      page: 2,
      pageSize: 10
    });

    assert.equal(calls.length, 2);
    assert.match(calls[0].sql, /COUNT\(DISTINCT p\.id\) AS total/);
    assert.deepEqual(calls[0].params, ['%动物%', 'read_aloud', '7']);
    assert.match(calls[1].sql, /LIMIT \? OFFSET \?/);
    assert.deepEqual(calls[1].params, ['%动物%', 'read_aloud', '7', 10, 10]);
  } finally {
    restore();
  }
});

test('listPapers clamps invalid paging values to the first page and default page size', async () => {
  const calls = [];
  const { repository, restore } = withMockedRepository(async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes('COUNT(DISTINCT p.id) AS total')) {
      return [[{ total: 0 }]];
    }
    return [[]];
  });

  try {
    const result = await repository.listPapers({
      authUser: { id: '1', role: 'ADMIN' },
      page: -3,
      pageSize: 0
    });

    assert.deepEqual(result, {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].params, []);
    assert.deepEqual(calls[1].params, [10, 0]);
  } finally {
    restore();
  }
});
