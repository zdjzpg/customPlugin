const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

function getRuntimeModuleUrl() {
  return pathToFileURL(
    path.join(__dirname, '..', 'public', 'devToolRuntime.mjs')
  ).href;
}

test('runDevTool encodes text as base64 and decodes it back', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const encoded = await runDevTool('dev_base64_codec', {
    sourceText: 'Hello 中',
    base64Mode: 'encode'
  });
  assert.equal(encoded.outputText, 'SGVsbG8g5Lit');

  const decoded = await runDevTool('dev_base64_codec', {
    sourceText: 'SGVsbG8g5Lit',
    base64Mode: 'decode'
  });
  assert.equal(decoded.outputText, 'Hello 中');
});

test('runDevTool encodes text as unicode escapes and decodes escapes back to text', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const encoded = await runDevTool('dev_unicode_encode', {
    sourceText: 'A中'
  });
  assert.equal(encoded.outputText, '\\u0041\\u4e2d');

  const decoded = await runDevTool('dev_unicode_decode', {
    sourceText: '\\u0041\\u4e2d'
  });
  assert.equal(decoded.outputText, 'A中');
});

test('runDevTool converts between half-width and full-width text', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const fullWidth = await runDevTool('dev_halfwidth_to_fullwidth', {
    sourceText: 'ABC 123'
  });
  assert.equal(fullWidth.outputText, 'ＡＢＣ　１２３');

  const halfWidth = await runDevTool('dev_fullwidth_to_halfwidth', {
    sourceText: 'ＡＢＣ　１２３'
  });
  assert.equal(halfWidth.outputText, 'ABC 123');
});

test('runDevTool converts text into decimal unicode code points', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_decimal_unicode_encode', {
    sourceText: 'A中'
  });

  assert.equal(result.outputText, '65\n20013');
});

test('runDevTool encodes and decodes URLs', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const encoded = await runDevTool('dev_url_codec', {
    sourceText: 'https://example.com?q=中 文',
    urlMode: 'encode'
  });
  assert.equal(encoded.outputText, 'https%3A%2F%2Fexample.com%3Fq%3D%E4%B8%AD%20%E6%96%87');

  const decoded = await runDevTool('dev_url_codec', {
    sourceText: 'https%3A%2F%2Fexample.com%3Fq%3D%E4%B8%AD%20%E6%96%87',
    urlMode: 'decode'
  });
  assert.equal(decoded.outputText, 'https://example.com?q=中 文');
});

test('runDevTool formats valid json and reports invalid json clearly', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const formatted = await runDevTool('dev_json_format', {
    sourceText: '{"name":"codex","ok":true}'
  });
  assert.match(formatted.outputText, /\n  "name": "codex"/);

  await assert.rejects(
    () => runDevTool('dev_json_format', { sourceText: '{"name":}' }),
    /JSON 格式不正确/
  );
});

test('runDevTool generates uuids by count', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_uuid_generate', {
    uuidCount: 3
  });

  const lines = result.outputText.split('\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^[0-9a-f-]{36}$/i);
});

test('runDevTool encodes and decodes HTML entities', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const encoded = await runDevTool('dev_html_entity_codec', {
    sourceText: '<div class="x">中 & 文</div>',
    htmlEntityMode: 'encode'
  });
  assert.equal(encoded.outputText, '&lt;div class=&quot;x&quot;&gt;中 &amp; 文&lt;/div&gt;');

  const decoded = await runDevTool('dev_html_entity_codec', {
    sourceText: '&lt;div class=&quot;x&quot;&gt;中 &amp; 文&lt;/div&gt;',
    htmlEntityMode: 'decode'
  });
  assert.equal(decoded.outputText, '<div class="x">中 & 文</div>');
});

test('runDevTool converts raw HTTP headers into formatted json', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_http_headers_to_json', {
    sourceText: 'Host: example.com\nX-Trace-Id: abc-1\nCookie: a=1'
  });

  assert.equal(
    result.outputText,
    '{\n  "Host": "example.com",\n  "X-Trace-Id": "abc-1",\n  "Cookie": "a=1"\n}'
  );
});

test('runDevTool converts cookie text into formatted json', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_cookie_to_json', {
    sourceText: 'token=abc123; theme=dark; user=codex'
  });

  assert.equal(
    result.outputText,
    '{\n  "token": "abc123",\n  "theme": "dark",\n  "user": "codex"\n}'
  );
});

test('runDevTool converts a line list into an object-array json payload', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_list_to_json', {
    sourceText: 'https://a.com\nhttps://b.com',
    jsonFieldName: 'url'
  });

  assert.equal(
    result.outputText,
    '[\n  {\n    "url": "https://a.com"\n  },\n  {\n    "url": "https://b.com"\n  }\n]'
  );
});

test('runDevTool converts a json array field into a line list', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_to_list', {
    sourceText: '[{"name":"alpha"},{"name":"beta"}]',
    jsonPath: 'name'
  });

  assert.equal(result.outputText, 'alpha\nbeta');
});

test('runDevTool extracts a nested json field by path', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_field_extract', {
    sourceText: '{"user":{"profile":{"name":"Codex"}}}',
    jsonPath: 'user.profile.name'
  });

  assert.equal(result.outputText, 'Codex');
});

test('runDevTool converts timestamps into readable UTC text and ISO dates into timestamps', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const readable = await runDevTool('dev_timestamp_convert', {
    sourceText: '1717459200',
    timestampMode: 'to_readable'
  });
  assert.match(readable.outputText, /UTC：2024-06-04T00:00:00.000Z/);
  assert.match(readable.outputText, /毫秒级时间戳：1717459200000/);

  const timestamp = await runDevTool('dev_timestamp_convert', {
    sourceText: '2024-06-04T00:00:00.000Z',
    timestampMode: 'to_timestamp'
  });
  assert.match(timestamp.outputText, /秒级时间戳：1717459200/);
  assert.match(timestamp.outputText, /毫秒级时间戳：1717459200000/);
});

test('runDevTool converts integers between arbitrary bases', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_radix_convert', {
    sourceText: '255',
    fromBase: '10',
    toBase: '16'
  });

  assert.equal(result.outputText, 'ff');
});

test('runDevTool converts text into base-n code units and back', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const encoded = await runDevTool('dev_text_to_base_n', {
    sourceText: 'AB',
    codeBase: '16'
  });
  assert.equal(encoded.outputText, '41 42');

  const decoded = await runDevTool('dev_base_n_to_text', {
    sourceText: '41 42',
    codeBase: '16'
  });
  assert.equal(decoded.outputText, 'AB');
});

test('runDevTool converts html snippets into escaped js strings', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_html_to_js_string', {
    sourceText: '<div class="x">\n  hi\n</div>'
  });

  assert.equal(result.outputText, '"<div class=\\"x\\">\\n  hi\\n</div>"');
});

test('runDevTool hashes text with md5', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_md5_hash', {
    sourceText: 'hello'
  });

  assert.equal(result.outputText, '5d41402abc4b2a76b9719d911017c592');
});

test('runDevTool hashes each non-empty line with md5 in batch mode', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_md5_batch', {
    sourceText: 'hello\n\nworld'
  });

  assert.equal(
    result.outputText,
    '5d41402abc4b2a76b9719d911017c592\n7d793037a0760186574b0282f2f435e7'
  );
});

test('runDevTool hashes text with the selected sha algorithm', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_string_hash', {
    sourceText: 'hello',
    hashAlgorithm: 'sha256'
  });

  assert.equal(
    result.outputText,
    '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
  );
});

test('runDevTool converts url lines into a sitemap xml document', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_urls_to_sitemap', {
    sourceText: 'https://example.com\nhttps://example.com/docs'
  });

  assert.match(result.outputText, /<urlset/);
  assert.match(result.outputText, /<loc>https:\/\/example\.com<\/loc>/);
  assert.match(result.outputText, /<loc>https:\/\/example\.com\/docs<\/loc>/);
});

test('runDevTool builds a robots.txt document from form fields', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_robots_generate', {
    robotsUserAgent: '*',
    robotsAllow: '/public',
    robotsDisallow: '/admin\n/private',
    robotsSitemap: 'https://example.com/sitemap.xml'
  });

  assert.equal(
    result.outputText,
    'User-agent: *\nAllow: /public\nDisallow: /admin\nDisallow: /private\nSitemap: https://example.com/sitemap.xml'
  );
});

test('runDevTool parses a crontab expression into upcoming run times', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_crontab_parse', {
    sourceText: '*/30 9-10 * * 1-5',
    cronStartTime: '2026-06-05T09:10:00.000Z'
  });

  assert.match(result.outputText, /表达式：\*\/30 9-10 \* \* 1-5/);
  assert.match(result.outputText, /2026-06-05T09:30:00.000Z/);
  assert.match(result.outputText, /2026-06-05T10:00:00.000Z/);
  assert.match(result.outputText, /2026-06-05T10:30:00.000Z/);
});

test('runDevTool renders current browser user-agent information', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_browser_ua_info', {
    browserUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36',
    browserPlatform: 'Win32',
    browserLanguage: 'zh-CN'
  });

  assert.match(result.outputText, /User-Agent：Mozilla\/5\.0/);
  assert.match(result.outputText, /平台：Win32/);
  assert.match(result.outputText, /语言：zh-CN/);
});

test('runDevTool renders current screen parameter information', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_screen_info', {
    screenInfo: {
      width: 390,
      height: 844,
      availWidth: 390,
      availHeight: 780,
      devicePixelRatio: 3
    }
  });

  assert.match(result.outputText, /屏幕分辨率：390 x 844/);
  assert.match(result.outputText, /可用区域：390 x 780/);
  assert.match(result.outputText, /设备像素比：3/);
});

test('runDevTool builds a basic auth header from username and password', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_basic_auth_credential', {
    basicAuthUsername: 'codex',
    basicAuthPassword: 'OpenAI123'
  });

  assert.equal(result.outputText, 'Basic Y29kZXg6T3BlbkFJMTIz');
});

test('runDevTool returns the same html text for preview tools', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_html_preview', {
    sourceText: '<section><h1>Preview</h1><p>Hello</p></section>'
  });

  assert.equal(result.outputText, '<section><h1>Preview</h1><p>Hello</p></section>');
});

test('runDevTool strips html tags and keeps plain text content', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_strip_html_tags', {
    sourceText: '<div><h1>Title</h1><p>Hello <strong>Codex</strong></p></div>'
  });

  assert.equal(result.outputText, 'Title Hello Codex');
});

test('runDevTool converts line breaks into br tags', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_newline_to_br', {
    sourceText: 'line1\nline2\nline3'
  });

  assert.equal(result.outputText, 'line1<br>\nline2<br>\nline3');
});

test('runDevTool converts svg markup into a data uri string', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_svg_to_datauri', {
    sourceText: '<svg xmlns="http://www.w3.org/2000/svg"><text x="0" y="12">Hi</text></svg>'
  });

  assert.match(result.outputText, /^data:image\/svg\+xml,/);
  assert.match(result.outputText, /%3Csvg/);
});

test('runDevTool converts numeric-looking json string values into numbers', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_string_to_number', {
    sourceText: '{"count":"12","price":"8.5","name":"codex","nested":{"ok":"1"}}'
  });

  assert.equal(
    result.outputText,
    '{\n  "count": 12,\n  "price": 8.5,\n  "name": "codex",\n  "nested": {\n    "ok": 1\n  }\n}'
  );
});

test('runDevTool converts json numbers into strings recursively', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_number_to_string', {
    sourceText: '{"count":12,"price":8.5,"name":"codex","nested":{"ok":1}}'
  });

  assert.equal(
    result.outputText,
    '{\n  "count": "12",\n  "price": "8.5",\n  "name": "codex",\n  "nested": {\n    "ok": "1"\n  }\n}'
  );
});

test('runDevTool converts a json array into csv rows', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_to_csv', {
    sourceText: '[{"name":"alpha","count":1},{"name":"beta","count":2}]'
  });

  assert.equal(result.outputText, 'name,count\nalpha,1\nbeta,2');
});

test('runDevTool converts json into php array syntax', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_to_php', {
    sourceText: '{"name":"codex","count":2}',
    phpArrayStyle: 'short'
  });

  assert.match(result.outputText, /^\[\s*'name' => 'codex',/);
  assert.match(result.outputText, /'count' => 2/);
});

test('runDevTool converts a js object literal into formatted json', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_js_object_to_json', {
    sourceText: "({ name: 'codex', count: 2, enabled: true })"
  });

  assert.equal(
    result.outputText,
    '{\n  "name": "codex",\n  "count": 2,\n  "enabled": true\n}'
  );
});

test('runDevTool converts json into a js const object export', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_to_js_object', {
    sourceText: '{"name":"codex","count":2}',
    jsExportName: 'toolConfig'
  });

  assert.match(result.outputText, /^const toolConfig = \{/);
  assert.match(result.outputText, /name: "codex"/);
  assert.match(result.outputText, /count: 2/);
});

test('runDevTool merges multiple json objects split by blank lines', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_merge', {
    sourceText: '{"name":"codex"}\n\n{"count":2}\n\n{"nested":{"ok":true}}',
    jsonMergeMode: 'object_merge'
  });

  assert.equal(
    result.outputText,
    '{\n  "name": "codex",\n  "count": 2,\n  "nested": {\n    "ok": true\n  }\n}'
  );
});

test('runDevTool extracts flattened key-value pairs from json', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_key_value_extract', {
    sourceText: '{"name":"codex","nested":{"count":2},"items":["a","b"]}',
    keyValueSeparator: '='
  });

  assert.equal(
    result.outputText,
    'name=codex\nnested.count=2\nitems.0=a\nitems.1=b'
  );
});

test('runDevTool generates an rsa pem key pair locally', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_rsa_keypair_generate', {
    rsaKeySize: '2048'
  });

  assert.match(result.outputText, /-----BEGIN PUBLIC KEY-----/);
  assert.match(result.outputText, /-----BEGIN PRIVATE KEY-----/);
});

test('runDevTool renders browser fingerprint details from current device info', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_browser_fingerprint_check', {
    browserUserAgent: 'Mozilla/5.0 Test',
    browserPlatform: 'Win32',
    browserLanguage: 'zh-CN',
    browserLanguages: ['zh-CN', 'en-US'],
    browserTimezone: 'Asia/Shanghai',
    browserCookieEnabled: true,
    browserDoNotTrack: '1',
    browserHardwareConcurrency: 8,
    browserDeviceMemory: 16,
    browserMaxTouchPoints: 0,
    browserOnline: true,
    screenInfo: {
      width: 390,
      height: 844,
      availWidth: 390,
      availHeight: 780,
      devicePixelRatio: 3,
      colorDepth: 24
    },
    viewportInfo: {
      width: 390,
      height: 844
    }
  });

  assert.match(result.outputText, /User-Agent：Mozilla\/5.0 Test/);
  assert.match(result.outputText, /语言列表：zh-CN, en-US/);
  assert.match(result.outputText, /时区：Asia\/Shanghai/);
  assert.match(result.outputText, /逻辑核心数：8/);
  assert.match(result.outputText, /设备内存：16 GB/);
});

test('runDevTool queries multiple public ip sources in browser mode', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('ipify')) {
      return {
        ok: true,
        json: async () => ({ ip: '1.1.1.1' })
      };
    }

    if (String(url).includes('myip')) {
      return {
        ok: true,
        json: async () => ({ ip: '2.2.2.2' })
      };
    }

    return {
      ok: false,
      json: async () => ({})
    };
  };

  try {
    const { runDevTool } = await import(getRuntimeModuleUrl());
    const result = await runDevTool('dev_multi_source_ip_check', {});
    assert.match(result.outputText, /ipify：1\.1\.1\.1/);
    assert.match(result.outputText, /myip：2\.2\.2\.2/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('runDevTool converts pasted excel table text into json rows', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_excel_to_json', {
    sourceText: 'name\tcount\nalpha\t1\nbeta\t2'
  });

  assert.equal(
    result.outputText,
    '[\n  {\n    "name": "alpha",\n    "count": "1"\n  },\n  {\n    "name": "beta",\n    "count": "2"\n  }\n]'
  );
});

test('runDevTool converts pasted excel table text into nested array syntax', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_excel_to_array', {
    sourceText: 'name\tcount\nalpha\t1\nbeta\t2'
  });

  assert.equal(result.outputText, '[["name","count"],["alpha","1"],["beta","2"]]');
});

test('runDevTool converts pasted excel table text into html table markup', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_excel_to_html', {
    sourceText: 'name\tcount\nalpha\t1'
  });

  assert.match(result.outputText, /<table>/);
  assert.match(result.outputText, /<th>name<\/th>/);
  assert.match(result.outputText, /<td>alpha<\/td>/);
});

test('runDevTool converts json into a plain javascript array or object literal', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_to_array', {
    sourceText: '{"name":"codex","count":2}'
  });

  assert.equal(result.outputText, '{ name: "codex", count: 2 }');
});

test('runDevTool converts a json array into tab-delimited excel text', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_array_to_excel', {
    sourceText: '[{"name":"alpha","count":1},{"name":"beta","count":2}]'
  });

  assert.equal(result.outputText, 'name\tcount\nalpha\t1\nbeta\t2');
});

test('runDevTool converts a json object into key-value excel text', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_object_to_excel', {
    sourceText: '{"name":"codex","count":2}'
  });

  assert.equal(result.outputText, 'key\tvalue\nname\tcodex\ncount\t2');
});

test('runDevTool converts pasted excel key-value rows into json object', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_excel_to_kv_json', {
    sourceText: 'key\tvalue\nname\tcodex\ncount\t2'
  });

  assert.equal(
    result.outputText,
    '{\n  "name": "codex",\n  "count": "2"\n}'
  );
});

test('runDevTool converts a json object into key-value excel rows', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_kv_json_to_excel', {
    sourceText: '{"name":"codex","count":2}'
  });

  assert.equal(result.outputText, 'key\tvalue\nname\tcodex\ncount\t2');
});

test('runDevTool flattens nested json into one-level dotted keys', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_flatten', {
    sourceText: '{"user":{"profile":{"name":"codex"}},"items":[{"id":1},{"id":2}]}'
  });

  assert.equal(
    result.outputText,
    '{\n  "user.profile.name": "codex",\n  "items.0.id": 1,\n  "items.1.id": 2\n}'
  );
});

test('runDevTool expands dotted json keys back into nested structure', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_expand', {
    sourceText: '{"user.profile.name":"codex","items.0.id":1,"items.1.id":2}'
  });

  assert.equal(
    result.outputText,
    '{\n  "user": {\n    "profile": {\n      "name": "codex"\n    }\n  },\n  "items": [\n    {\n      "id": 1\n    },\n    {\n      "id": 2\n    }\n  ]\n}'
  );
});

test('runDevTool finds keys missing from the comparison json', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_missing_find', {
    sourceText: '{"name":"codex","count":2,"nested":{"enabled":true,"lang":"zh-CN"}}',
    compareJsonText: '{"name":"codex","nested":{"enabled":true}}'
  });

  assert.equal(result.outputText, 'count\nnested.lang');
});

test('runDevTool clears json values while preserving structure', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_clear_values', {
    sourceText: '{"name":"codex","count":2,"ok":true,"nested":{"lang":"zh-CN"}}',
    jsonClearMode: 'empty_string'
  });

  assert.equal(
    result.outputText,
    '{\n  "name": "",\n  "count": "",\n  "ok": "",\n  "nested": {\n    "lang": ""\n  }\n}'
  );
});

test('runDevTool slices a json array into fixed-size chunks', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_json_slice', {
    sourceText: '[1,2,3,4,5]',
    jsonSliceSize: '2'
  });

  assert.equal(result.outputText, '[\n  1,\n  2\n]\n\n[\n  3,\n  4\n]\n\n[\n  5\n]');
});

test('runDevTool adds http protocol to url lines that lack a scheme', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_add_http_protocol', {
    sourceText: 'example.com\nhttps://openai.com\nhttp://localhost:3000'
  });

  assert.equal(result.outputText, 'http://example.com\nhttps://openai.com\nhttp://localhost:3000');
});

test('runDevTool removes url query params in batch', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_url_params_remove', {
    sourceText: 'https://example.com/a?x=1&y=2#top\nhttps://openai.com/path?q=chatgpt'
  });

  assert.equal(result.outputText, 'https://example.com/a#top\nhttps://openai.com/path');
});

test('runDevTool sets and overwrites url query params in batch', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_url_params_set', {
    sourceText: 'https://example.com/a?x=1\nhttps://openai.com/path',
    urlSetParamsText: 'x=9\ny=2'
  });

  assert.equal(result.outputText, 'https://example.com/a?x=9&y=2\nhttps://openai.com/path?x=9&y=2');
});

test('runDevTool generates common seo meta tags from form fields', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_web_meta_generate', {
    metaTitle: 'PP 工具站',
    metaDescription: '文件处理与文本处理一站完成',
    metaKeywords: 'PDF,文本,编程',
    metaCanonical: 'https://example.com/tools',
    metaRobots: 'index,follow'
  });

  assert.match(result.outputText, /<title>PP 工具站<\/title>/);
  assert.match(result.outputText, /name="description" content="文件处理与文本处理一站完成"/);
  assert.match(result.outputText, /name="keywords" content="PDF,文本,编程"/);
  assert.match(result.outputText, /rel="canonical" href="https:\/\/example.com\/tools"/);
  assert.match(result.outputText, /name="robots" content="index,follow"/);
});

test('runDevTool reports browser ipv6 support using a public v6 echo endpoint', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    text: async () => '2408:8207:1234::1\n'
  });

  try {
    const { runDevTool } = await import(getRuntimeModuleUrl());
    const result = await runDevTool('dev_ipv6_check', {});
    assert.match(result.outputText, /IPv6 支持：是/);
    assert.match(result.outputText, /IPv6 地址：2408:8207:1234::1/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('runDevTool converts simple ddl into php field metadata array', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_ddl_to_php_array', {
    sourceText: "CREATE TABLE users (\n  id bigint(20) NOT NULL COMMENT '主键',\n  nickname varchar(64) DEFAULT NULL COMMENT '昵称'\n)"
  });

  assert.match(result.outputText, /'id' => \[/);
  assert.match(result.outputText, /'type' => 'bigint\(20\)'/);
  assert.match(result.outputText, /'label' => '主键'/);
  assert.match(result.outputText, /'nickname' => \[/);
});

test('runDevTool converts a field list into php array syntax', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_field_list_to_php_array', {
    sourceText: 'id\nnickname\ncreated_at'
  });

  assert.equal(result.outputText, "['id', 'nickname', 'created_at']");
});

test('runDevTool converts a text list into a js object literal', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_text_list_to_js_object', {
    sourceText: 'apple\nbanana',
    jsObjectMode: 'same_value'
  });

  assert.equal(result.outputText, '{ apple: "apple", banana: "banana" }');
});

test('runDevTool converts css text into js style-injection code', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_css_to_js', {
    sourceText: 'body { color: red; }'
  });

  assert.match(result.outputText, /const style = document\.createElement\('style'\);/);
  assert.match(result.outputText, /style\.textContent = "body \{ color: red; \}";/);
});

test('runDevTool converts html markup into a json tree', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_html_to_json', {
    sourceText: '<div class="box"><span>Hello</span></div>'
  });

  assert.match(result.outputText, /"tag": "div"/);
  assert.match(result.outputText, /"class": "box"/);
  assert.match(result.outputText, /"tag": "span"/);
});

test('runDevTool imports plain text into javascript variable code', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_js_data_import', {
    sourceText: 'alpha\nbeta',
    jsImportName: 'items'
  });

  assert.equal(result.outputText, 'const items = ["alpha", "beta"];');
});

test('runDevTool removes inline style attributes from html markup', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_html_inline_style_remove', {
    sourceText: '<div style="color:red" data-id="1"><span style="font-size:12px">Hi</span></div>',
    inlineStyleNames: ''
  });

  assert.equal(result.outputText, '<div data-id="1"><span>Hi</span></div>');
});

test('runDevTool converts cookie text into import script code', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_cookie_import_code', {
    sourceText: 'token=abc123; theme=dark',
    cookieDomain: '.example.com',
    cookiePath: '/'
  });

  assert.match(result.outputText, /document\.cookie = "token=abc123; domain=.example.com; path=\/";/);
  assert.match(result.outputText, /document\.cookie = "theme=dark; domain=.example.com; path=\/";/);
});

test('runDevTool converts i18n excel-style rows into locale json blocks', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_frontend_i18n_convert', {
    sourceText: 'key\tzh-CN\ten-US\nwelcome\t欢迎\tWelcome\nlogout\t退出登录\tLog out'
  });

  assert.match(result.outputText, /zh-CN:/);
  assert.match(result.outputText, /"welcome": "欢迎"/);
  assert.match(result.outputText, /en-US:/);
  assert.match(result.outputText, /"logout": "Log out"/);
});

test('runDevTool generates random ipv4 addresses in batch', async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.5;

  try {
    const { runDevTool } = await import(getRuntimeModuleUrl());
    const result = await runDevTool('dev_ip_generate', {
      generateCount: '3'
    });

    const lines = result.outputText.split('\n');
    assert.equal(lines.length, 3);
    assert.ok(lines.every((line) => /^\d{1,3}(\.\d{1,3}){3}$/.test(line)));
  } finally {
    Math.random = originalRandom;
  }
});

test('runDevTool expands ip ranges and cidr into individual ipv4 lines', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_ip_range_restore', {
    sourceText: '192.168.1.1-192.168.1.3\n10.0.0.0/30'
  });

  assert.equal(
    result.outputText,
    '192.168.1.1\n192.168.1.2\n192.168.1.3\n10.0.0.0\n10.0.0.1\n10.0.0.2\n10.0.0.3'
  );
});

test('runDevTool converts ipv4 addresses into decimal numbers', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_ip_to_number', {
    sourceText: '127.0.0.1\n192.168.0.1'
  });

  assert.equal(result.outputText, '2130706433\n3232235521');
});

test('runDevTool converts ipv4 addresses into ipv4-mapped ipv6 text', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_ipv4_to_ipv6', {
    sourceText: '192.168.0.1'
  });

  assert.equal(result.outputText, '::ffff:c0a8:0001');
});

test('runDevTool hashes text using dedicated sha algorithm tools', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());
  const algorithms = [
    ['dev_sha1_hash', 'sha1'],
    ['dev_sha224_hash', 'sha224'],
    ['dev_sha256_hash', 'sha256'],
    ['dev_sha384_hash', 'sha384'],
    ['dev_sha512_hash', 'sha512']
  ];

  for (const [toolKey, algorithm] of algorithms) {
    const result = await runDevTool(toolKey, { sourceText: 'hello' });
    const expected = crypto.createHash(algorithm).update('hello').digest('hex');
    assert.equal(result.outputText, expected);
  }
});

test('runDevTool converts each line into ascii code points', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_ascii_batch_encode', {
    sourceText: 'AB\n中'
  });

  assert.equal(result.outputText, '65 66\n20013');
});

test('runDevTool generates random mac addresses with the selected separator', async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.25;

  try {
    const { runDevTool } = await import(getRuntimeModuleUrl());
    const result = await runDevTool('dev_mac_generate', {
      generateCount: '2',
      macSeparator: '-'
    });

    const lines = result.outputText.split('\n');
    assert.equal(lines.length, 2);
    assert.ok(lines.every((line) => /^[0-9A-F]{2}(?:-[0-9A-F]{2}){5}$/.test(line)));
  } finally {
    Math.random = originalRandom;
  }
});

test('runDevTool generates random hex colors in batch', async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.5;

  try {
    const { runDevTool } = await import(getRuntimeModuleUrl());
    const result = await runDevTool('dev_random_color_generate', {
      generateCount: '4'
    });

    const lines = result.outputText.split('\n');
    assert.equal(lines.length, 4);
    assert.ok(lines.every((line) => /^#[0-9A-F]{6}$/.test(line)));
  } finally {
    Math.random = originalRandom;
  }
});

test('runDevTool removes google translate font wrappers while keeping text', async () => {
  const { runDevTool } = await import(getRuntimeModuleUrl());

  const result = await runDevTool('dev_google_translate_tag_clean', {
    sourceText: '<p><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">Hello</font></font> <span>World</span></p>'
  });

  assert.equal(result.outputText, '<p>Hello <span>World</span></p>');
});
