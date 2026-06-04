# 编程工具 Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `编程工具` buyer category, ship the first usable batch of local dev tools, and open the backend path for URL-based extraction and SSL inspection tools.

**Architecture:** Keep the current buyer shell and detail-page flow, but extend the tool model with a third category and three execution kinds: local browser runtime, backend parsing, and backend network inspection. Local dev tools return instant text results in-browser; remote dev tools submit JSON to a dedicated `/api/dev-tools/run` route and render text results in the same detail shell.

**Tech Stack:** Node.js 24, Express, static frontend ES modules, built-in `fetch`, built-in `tls`, built-in `crypto`, `node --test`

---

### Task 1: Add failing tests for the new category and dev-tool runtime

**Files:**
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolRuntime.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerShellMarkup.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCategoryMarkup.test.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`

- [ ] **Step 1: Write failing runtime tests for the first local dev tools**

```js
test('runDevTool encodes and decodes base64 text', async () => {
  const { runDevTool } = await import(moduleUrl);
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
```

- [ ] **Step 2: Write failing shell tests that require `编程工具` to appear beside `PPT 工具` and `文本工具`**

```js
assert.match(html, /编程工具/);
```

- [ ] **Step 3: Write a failing detail-markup test for a local dev tool and a remote dev tool**

```js
assert.match(localHtml, /data-tool-kind="local_dev_tool"/);
assert.match(remoteHtml, /data-tool-kind="backend_dev_tool"/);
assert.match(remoteHtml, /data-dev-tool-submit/);
```

- [ ] **Step 4: Run the focused tests to confirm they fail for the expected missing dev-tool behavior**

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolRuntime.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerShellMarkup.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCategoryMarkup.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs'
```

Expected: failures mentioning missing `runDevTool`, missing `编程工具`, or missing dev-tool detail markup.

### Task 2: Create the dev-tool catalog and local runtime

**Files:**
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\devToolCatalog.mjs`
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\devToolRuntime.mjs`
- Test: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolRuntime.test.cjs`

- [ ] **Step 1: Add the first visible `编程工具` catalog entries**

```js
export const devToolCatalog = [
  {
    key: 'dev_base64_codec',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'Base64 加解密',
    helperText: '对文本进行 Base64 编码与解码处理。',
    badgeTone: 'blue'
  },
  {
    key: 'dev_uuid_generate',
    kind: 'local_dev_tool',
    categoryKey: 'dev_tools',
    label: 'UUID 生成器',
    helperText: '按数量批量生成唯一标识符。',
    badgeTone: 'green'
  },
  {
    key: 'dev_sitemap_extract',
    kind: 'backend_dev_tool',
    categoryKey: 'dev_tools',
    label: 'sitemap 链接提取',
    helperText: '读取 Sitemap XML 并提取全部 URL 链接。',
    badgeTone: 'slate'
  },
  {
    key: 'dev_ssl_check',
    kind: 'network_dev_tool',
    categoryKey: 'dev_tools',
    label: '网站 SSL 证书检测',
    helperText: '检测目标网站证书主题、签发者与有效期信息。',
    badgeTone: 'cyan'
  }
];
```

- [ ] **Step 2: Implement the first local runtime tools with real pure functions**

```js
export async function runDevTool(toolKey, input) {
  if (toolKey === 'dev_uuid_generate') {
    const count = toPositiveInteger(input?.uuidCount, 10, 1, 100);
    return {
      outputText: Array.from({ length: count }, () => crypto.randomUUID()).join('\n')
    };
  }

  if (toolKey === 'dev_unicode_encode') {
    return {
      outputText: Array.from(String(input?.sourceText || ''))
        .map((char) => `\\u${char.codePointAt(0).toString(16).padStart(4, '0')}`)
        .join('')
    };
  }
}
```

- [ ] **Step 3: Support these local tools in `runDevTool`**

```text
dev_base64_codec
dev_uuid_generate
dev_unicode_encode
dev_unicode_decode
dev_halfwidth_to_fullwidth
dev_fullwidth_to_halfwidth
dev_decimal_unicode_encode
dev_url_codec
dev_json_format
```

- [ ] **Step 4: Run the runtime tests and make them pass cleanly**

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolRuntime.test.cjs'
```

Expected: PASS for the first local dev-tool behaviors.

### Task 3: Integrate the `编程工具` category into the buyer shell and detail flow

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\buyerShellMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\mobileBuyerMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCategoryMarkup.mjs`

- [ ] **Step 1: Add `dev_tools` to the category catalog and homepage cards**

```js
{
  key: 'dev_tools',
  label: '编程工具',
  description: '覆盖编码转换、链接提取、站点检测和常用开发辅助能力。',
  iconLabel: 'D'
}
```

- [ ] **Step 2: Extend the buyer search pool and category listing to include `devToolCatalog`**

```js
function getToolsForCategory(categoryKey) {
  if (categoryKey === 'dev_tools') {
    return devToolCatalog;
  }
}
```

- [ ] **Step 3: Update the quick keywords so the homepage can surface dev-tool intents**

```js
const quickKeywordCatalog = ['PDF 转 PPT', '文本去重', 'UUID', 'Base64', 'sitemap', 'SSL'];
```

- [ ] **Step 4: Run the category and shell tests to confirm the new category renders in desktop and mobile shells**

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerShellMarkup.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCategoryMarkup.test.cjs'
```

Expected: PASS with `编程工具` visible in the shell and category-card output.

### Task 4: Add dev-tool detail markup and frontend execution branches

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\toolCatalogMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\app.js`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\styles.css`
- Test: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs`

- [ ] **Step 1: Add a dedicated dev-tool detail renderer that branches by tool kind**

```js
if (item.kind === 'local_dev_tool' || item.kind === 'backend_dev_tool' || item.kind === 'network_dev_tool') {
  return createDevToolDetailMarkup(item, options);
}
```

- [ ] **Step 2: Add form fields for the first dev tools**

```js
if (item.key === 'dev_base64_codec') {
  return `
    <label class="field"><span>转换方式</span><select data-base64-mode>...</select></label>
  `;
}

if (item.key === 'dev_sitemap_extract' || item.key === 'dev_ssl_check') {
  return `
    <label class="field field-wide">
      <span>目标地址</span>
      <input type="text" data-target-url placeholder="https://example.com/sitemap.xml" />
    </label>
  `;
}
```

- [ ] **Step 3: Add local submit handling and remote JSON submit handling in `app.js`**

```js
if (toolItem.kind === 'local_dev_tool') {
  form.addEventListener('submit', handleLocalDevToolSubmit);
  return;
}

if (toolItem.kind === 'backend_dev_tool' || toolItem.kind === 'network_dev_tool') {
  form.addEventListener('submit', handleRemoteDevToolSubmit);
  return;
}
```

- [ ] **Step 4: Reuse a shared text-result shell with copy support for dev tools**

```js
outputElement.value = result.outputText || '';
setMessage(getConversionMessageElement(), '处理完成，可以复制结果了。');
```

- [ ] **Step 5: Run the detail-markup and runtime-focused tests again**

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolRuntime.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs'
```

Expected: PASS with local and remote dev-tool details rendering correctly.

### Task 5: Add the backend dev-tool service and route

**Files:**
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\services\devToolsService.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\bootstrap.cjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\server\app.cjs`
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolsService.test.cjs`
- Create: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolsRoutes.test.cjs`

- [ ] **Step 1: Write failing service tests for sitemap extraction, HTML link extraction, and SSL inspection**

```js
test('runTool extracts loc entries from sitemap xml', async () => {
  const service = createDevToolsService({
    fetchText: async () => '<?xml version="1.0"?><urlset><url><loc>https://a.com</loc></url></urlset>'
  });
  const result = await service.runTool({ toolKey: 'dev_sitemap_extract', toolOptions: { targetUrl: 'https://a.com/sitemap.xml' } });
  assert.equal(result.outputText, 'https://a.com');
});
```

- [ ] **Step 2: Implement the service with dedicated helpers for URL fetch, sitemap parsing, href extraction, and TLS certificate probing**

```js
async function probeTlsCertificate(targetHost, targetPort, tlsConnect) {
  return new Promise((resolve, reject) => {
    const socket = tlsConnect({
      host: targetHost,
      port: targetPort,
      servername: targetHost,
      rejectUnauthorized: false
    }, () => {
      const certificate = socket.getPeerCertificate(true);
      socket.end();
      resolve(certificate);
    });
    socket.on('error', reject);
  });
}
```

- [ ] **Step 3: Add `POST /api/dev-tools/run` with buyer-session auth and stats recording**

```js
app.post('/api/dev-tools/run', async (request, response) => {
  const session = readAuthorizedSession(request, sessionRepository, 'buyer');
  if (!session) {
    response.status(401).json({ ok: false, reason: 'UNAUTHORIZED' });
    return;
  }
});
```

- [ ] **Step 4: Keep stats visible in the admin table by recording remote dev-tool executions with the same usage repository**

```js
usageStatsRepository?.recordConversionStart({
  codeId: session.codeId || null,
  codeValue: session.codeValue || null,
  conversionKey: input.toolKey
});
```

- [ ] **Step 5: Run service and route tests until both success and failure paths pass**

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolsService.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolsRoutes.test.cjs'
```

Expected: PASS for auth rejection, sitemap success, SSL success, and invalid-input failures.

### Task 6: Extend admin labels and run the full verification set

**Files:**
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\public\adminUsageStatsMarkup.mjs`
- Modify: `D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\adminUsageStatsMarkup.test.cjs`
- Test: all changed tests

- [ ] **Step 1: Add Chinese admin labels for the first remote dev-tool keys**

```js
const labels = {
  dev_sitemap_extract: 'sitemap 链接提取',
  dev_html_link_extract: 'html 链接提取',
  dev_ssl_check: '网站 SSL 证书检测'
};
```

- [ ] **Step 2: Run the targeted regression tests for runtime, UI, backend route, and admin labels**

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolRuntime.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolsService.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\devToolsRoutes.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\buyerShellMarkup.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCategoryMarkup.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\toolCatalogMarkup.test.cjs' `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\adminUsageStatsMarkup.test.cjs'
```

- [ ] **Step 3: Run the full Node test suite**

```powershell
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test `
  'D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web\tests\*.test.cjs'
```

Expected: full suite passes with the new dev-tool coverage included.

- [ ] **Step 4: Smoke-test the buyer UI locally**

```powershell
cd D:\aa-workplace\customPlugin\codex-pdf-converter-web\pdf-converter-web
& 'C:\Users\19816\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' server/index.cjs
```

Verify:
- `http://127.0.0.1:3015/` shows the `编程工具` category card
- search finds `UUID`, `Base64`, and `SSL`
- `Base64 加解密` works end-to-end in-browser
- `sitemap 链接提取` returns URL lines for a reachable sitemap
- `网站 SSL 证书检测` returns readable certificate text
- admin usage stats can display the new remote dev-tool labels
