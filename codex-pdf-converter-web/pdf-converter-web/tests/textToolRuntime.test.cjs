const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('runTextTool deduplicates repeated lines', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_unique', {
    sourceText: 'apple\nbanana\napple\npear'
  });

  assert.equal(result.outputText, 'apple\nbanana\npear');
});

test('runTextTool removes blank lines', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_remove_blank_lines', {
    sourceText: 'a\n\nb\n \n\nc'
  });

  assert.equal(result.outputText, 'a\nb\nc');
});

test('runTextTool removes all spaces', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_remove_spaces', {
    sourceText: ' a b  c '
  });

  assert.equal(result.outputText, 'abc');
});

test('runTextTool replaces text in batch mode', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_replace_batch', {
    sourceText: 'hello world\nhello codex',
    findText: 'hello',
    replaceText: 'hi'
  });

  assert.equal(result.outputText, 'hi world\nhi codex');
});

test('runTextTool returns character statistics', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_char_count', {
    sourceText: 'hi\nworld'
  });

  assert.equal(result.summary.totalChars, 8);
  assert.equal(result.summary.nonWhitespaceChars, 7);
  assert.equal(result.summary.lineCount, 2);
});

test('runTextTool converts english case based on the selected mode', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_case_convert', {
    sourceText: 'Hello Codex',
    caseMode: 'upper'
  });

  assert.equal(result.outputText, 'HELLO CODEX');
});

test('runTextTool extracts URLs from mixed text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_extract_urls', {
    sourceText: '访问 https://openai.com 和 http://example.org/page?x=1'
  });

  assert.equal(result.outputText, 'https://openai.com\nhttp://example.org/page?x=1');
});

test('runTextTool extracts email addresses from text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_extract_emails', {
    sourceText: '联系 a@test.com，备用邮箱 b.user@demo.cn'
  });

  assert.equal(result.outputText, 'a@test.com\nb.user@demo.cn');
});

test('runTextTool extracts mobile numbers from text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_extract_phones', {
    sourceText: '手机号 13800138000，备用 15688889999'
  });

  assert.equal(result.outputText, '13800138000\n15688889999');
});

test('runTextTool extracts domains from text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_extract_domains', {
    sourceText: 'openai.com, docs.example.org/path'
  });

  assert.equal(result.outputText, 'openai.com\ndocs.example.org');
});

test('runTextTool extracts IPv4 addresses from text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_extract_ips', {
    sourceText: '服务器 192.168.1.1，网关 10.0.0.254'
  });

  assert.equal(result.outputText, '192.168.1.1\n10.0.0.254');
});

test('runTextTool extracts number sequences from text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_extract_numbers', {
    sourceText: '订单 12345，数量 88，金额 9000'
  });

  assert.equal(result.outputText, '12345\n88\n9000');
});

test('runTextTool converts delimiter-separated text into a line-based list', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_to_list', {
    sourceText: 'a,b,c',
    separator: ','
  });

  assert.equal(result.outputText, 'a\nb\nc');
});

test('runTextTool joins a list into one line with a separator', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('list_to_text', {
    sourceText: 'apple\nbanana\npear',
    separator: ', '
  });

  assert.equal(result.outputText, 'apple, banana, pear');
});

test('runTextTool sorts a text list ascending', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('list_sort', {
    sourceText: 'pear\napple\nbanana',
    sortMode: 'asc'
  });

  assert.equal(result.outputText, 'apple\nbanana\npear');
});

test('runTextTool shuffles a text list while keeping the same items', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('list_shuffle', {
    sourceText: 'a\nb\nc\nd'
  });

  assert.deepEqual(
    result.outputText.split('\n').sort(),
    ['a', 'b', 'c', 'd']
  );
});

test('runTextTool counts duplicate lines in a list', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('list_duplicate_count', {
    sourceText: 'apple\nbanana\napple\nbanana\nbanana'
  });

  assert.equal(result.outputText, 'apple\t2\nbanana\t3');
});

test('runTextTool adds prefix and suffix to every non-empty line', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('list_add_prefix_suffix', {
    sourceText: 'a\nb',
    prefixText: '[',
    suffixText: ']'
  });

  assert.equal(result.outputText, '[a]\n[b]');
});

test('runTextTool keeps the leftmost n characters for every line', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('list_cut_left', {
    sourceText: 'apple\nbanana',
    cutLength: 3
  });

  assert.equal(result.outputText, 'app\nban');
});

test('runTextTool keeps the rightmost n characters for every line', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('list_cut_right', {
    sourceText: 'apple\nbanana',
    cutLength: 3
  });

  assert.equal(result.outputText, 'ple\nana');
});

test('runTextTool extracts matches with a custom regular expression', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_regex_extract', {
    sourceText: '订单A-100，订单B-200',
    regexPattern: '[A-Z]-\\d+'
  });

  assert.equal(result.outputText, 'A-100\nB-200');
});

test('runTextTool encodes text as unicode escapes', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_unicode_convert', {
    sourceText: 'A中',
    unicodeMode: 'encode'
  });

  assert.equal(result.outputText, '\\u0041\\u4e2d');
});

test('runTextTool decodes unicode escapes back to text', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_unicode_convert', {
    sourceText: '\\u0041\\u4e2d',
    unicodeMode: 'decode'
  });

  assert.equal(result.outputText, 'A中');
});

test('runTextTool converts numbers into uppercase RMB wording', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_money_upper', {
    sourceText: '1234.56'
  });

  assert.match(result.outputText, /壹仟贰佰叁拾肆元伍角陆分/);
});

test('runTextTool converts half-width punctuation into full-width punctuation', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_symbol_convert', {
    sourceText: 'Hello, world!',
    symbolMode: 'en_to_zh'
  });

  assert.equal(result.outputText, 'Hello， world！');
});

test('runTextTool checks banned words and reports matches', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_banned_words_check', {
    sourceText: '这是最棒的顶级优惠，内部返现链接',
    bannedWords: '顶级\n返现'
  });

  assert.equal(result.outputText, '顶级\n返现');
  assert.equal(result.summary.matchCount, 2);
});

test('runTextTool generates uuids by count', async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'public', 'textToolRuntime.mjs')
  ).href;
  const { runTextTool } = await import(moduleUrl);

  const result = runTextTool('text_uuid_generate', {
    uuidCount: 3
  });

  const lines = result.outputText.split('\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^[0-9a-f-]{36}$/i);
});
