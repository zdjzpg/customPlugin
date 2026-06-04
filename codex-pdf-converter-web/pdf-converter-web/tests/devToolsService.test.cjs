const test = require('node:test');
const assert = require('node:assert/strict');

const { createDevToolsService } = require('../server/services/devToolsService.cjs');

test('runTool extracts loc entries from sitemap xml', async () => {
  const service = createDevToolsService({
    fetchText: async () => `<?xml version="1.0" encoding="UTF-8"?>
      <urlset>
        <url><loc>https://example.com/a</loc></url>
        <url><loc>https://example.com/b</loc></url>
      </urlset>`
  });

  const result = await service.runTool({
    toolKey: 'dev_sitemap_extract',
    toolOptions: {
      targetUrl: 'https://example.com/sitemap.xml'
    }
  });

  assert.equal(result.outputText, 'https://example.com/a\nhttps://example.com/b');
});

test('runTool extracts href links from a fetched html document', async () => {
  const service = createDevToolsService({
    fetchText: async () => `
      <html>
        <body>
          <a href="/docs">Docs</a>
          <a href="https://openai.com/api">API</a>
        </body>
      </html>
    `
  });

  const result = await service.runTool({
    toolKey: 'dev_html_link_extract',
    toolOptions: {
      targetUrl: 'https://example.com/page'
    }
  });

  assert.equal(result.outputText, 'https://example.com/docs\nhttps://openai.com/api');
});

test('runTool formats certificate inspection details into readable text', async () => {
  const service = createDevToolsService({
    tlsProbe: async () => ({
      subject: { CN: 'example.com' },
      issuer: { O: 'Test CA' },
      valid_from: 'Jun  1 00:00:00 2026 GMT',
      valid_to: 'Jun  1 00:00:00 2027 GMT',
      subjectaltname: 'DNS:example.com, DNS:www.example.com'
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_ssl_check',
    toolOptions: {
      targetUrl: 'https://example.com'
    }
  });

  assert.match(result.outputText, /example\.com/);
  assert.match(result.outputText, /Test CA/);
  assert.match(result.outputText, /www\.example\.com/);
});

test('runTool rejects a missing target url for remote tools', async () => {
  const service = createDevToolsService({
    fetchText: async () => '',
    tlsProbe: async () => ({})
  });

  await assert.rejects(
    () => service.runTool({
      toolKey: 'dev_sitemap_extract',
      toolOptions: {
        targetUrl: '   '
      }
    }),
    /请先填写目标地址/
  );
});

test('runTool formats ssl expiry output with remaining days', async () => {
  const service = createDevToolsService({
    tlsProbe: async () => ({
      subject: { CN: 'example.com' },
      issuer: { O: 'Test CA' },
      valid_from: 'Jun  1 00:00:00 2026 GMT',
      valid_to: 'Jun 11 00:00:00 2026 GMT',
      subjectaltname: 'DNS:example.com'
    }),
    now: () => new Date('2026-06-05T00:00:00.000Z')
  });

  const result = await service.runTool({
    toolKey: 'dev_ssl_expiry_check',
    toolOptions: {
      targetUrl: 'https://example.com'
    }
  });

  assert.match(result.outputText, /证书主题：example\.com/);
  assert.match(result.outputText, /到期时间：Jun 11 00:00:00 2026 GMT/);
  assert.match(result.outputText, /剩余天数：6/);
});

test('runTool parses certificate text and formats subject and issuer fields', async () => {
  const service = createDevToolsService({
    parseCertificate: () => ({
      subject: 'CN=example.com\nO=Example Ltd',
      issuer: 'CN=Example Root CA',
      validFrom: 'Jun  1 00:00:00 2026 GMT',
      validTo: 'Jun 11 00:00:00 2026 GMT'
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_ssl_cert_parse',
    toolOptions: {
      certificateText: '-----BEGIN CERTIFICATE-----\nFAKE\n-----END CERTIFICATE-----'
    }
  });

  assert.match(result.outputText, /证书主题：CN=example\.com/);
  assert.match(result.outputText, /签发机构：CN=Example Root CA/);
  assert.match(result.outputText, /生效时间：Jun  1 00:00:00 2026 GMT/);
  assert.match(result.outputText, /到期时间：Jun 11 00:00:00 2026 GMT/);
});

test('runTool reports gzip compression support and response size details', async () => {
  const service = createDevToolsService({
    fetchMetadata: async () => ({
      finalUrl: 'https://example.com/',
      status: 200,
      contentEncoding: 'gzip',
      contentLength: '1234'
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_gzip_check',
    toolOptions: {
      targetUrl: 'https://example.com'
    }
  });

  assert.match(result.outputText, /检测地址：https:\/\/example\.com\//);
  assert.match(result.outputText, /压缩算法：gzip/);
  assert.match(result.outputText, /Content-Length：1234/);
});

test('runTool reports brotli compression support and response size details', async () => {
  const service = createDevToolsService({
    fetchMetadata: async () => ({
      finalUrl: 'https://example.com/docs',
      status: 200,
      contentEncoding: 'br',
      contentLength: '2048'
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_brotli_check',
    toolOptions: {
      targetUrl: 'https://example.com/docs'
    }
  });

  assert.match(result.outputText, /检测地址：https:\/\/example\.com\/docs/);
  assert.match(result.outputText, /压缩算法：br/);
  assert.match(result.outputText, /Content-Length：2048/);
});

test('runTool formats redirect analysis chain in order', async () => {
  const service = createDevToolsService({
    traceRedirects: async () => ([
      { url: 'http://example.com', status: 301, location: 'https://example.com' },
      { url: 'https://example.com', status: 302, location: 'https://www.example.com/home' },
      { url: 'https://www.example.com/home', status: 200, location: '' }
    ])
  });

  const result = await service.runTool({
    toolKey: 'dev_redirect_analysis',
    toolOptions: {
      targetUrl: 'http://example.com'
    }
  });

  assert.match(result.outputText, /1\. 301 http:\/\/example\.com -> https:\/\/example\.com/);
  assert.match(result.outputText, /2\. 302 https:\/\/example\.com -> https:\/\/www\.example\.com\/home/);
  assert.match(result.outputText, /3\. 200 https:\/\/www\.example\.com\/home/);
});

test('runTool formats whois lookup details into readable lines', async () => {
  const service = createDevToolsService({
    lookupWhois: async () => ({
      domain: 'example.com',
      registrar: 'Example Registrar',
      creationDate: '2020-01-01T00:00:00Z',
      expirationDate: '2030-01-01T00:00:00Z',
      nameServers: ['ns1.example.com', 'ns2.example.com']
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_whois_lookup',
    toolOptions: {
      targetUrl: 'https://example.com'
    }
  });

  assert.match(result.outputText, /域名：example\.com/);
  assert.match(result.outputText, /注册商：Example Registrar/);
  assert.match(result.outputText, /创建时间：2020-01-01T00:00:00Z/);
  assert.match(result.outputText, /到期时间：2030-01-01T00:00:00Z/);
  assert.match(result.outputText, /Name Server：ns1\.example\.com, ns2\.example\.com/);
});

test('runTool formats cdn detection result with cname and provider name', async () => {
  const service = createDevToolsService({
    detectCdn: async () => ({
      hostname: 'www.example.com',
      cdnDetected: true,
      providerName: 'Cloudflare',
      cnameChain: ['www.example.com', 'example.com.cdn.cloudflare.net']
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_cdn_check',
    toolOptions: {
      targetUrl: 'https://www.example.com'
    }
  });

  assert.match(result.outputText, /检测地址：www\.example\.com/);
  assert.match(result.outputText, /是否命中 CDN：是/);
  assert.match(result.outputText, /识别厂商：Cloudflare/);
  assert.match(result.outputText, /CNAME 链：www\.example\.com -> example\.com\.cdn\.cloudflare\.net/);
});

test('runTool extracts title, description, keywords, canonical, and robots from page html', async () => {
  const service = createDevToolsService({
    fetchText: async () => `
      <html>
        <head>
          <title>PP 工具站</title>
          <meta name="description" content="文件处理与文本处理一站完成">
          <meta name="keywords" content="PDF, 文本工具, 编程工具">
          <meta name="robots" content="index,follow">
          <link rel="canonical" href="https://example.com/tools">
        </head>
      </html>
    `
  });

  const result = await service.runTool({
    toolKey: 'dev_meta_info_check',
    toolOptions: {
      targetUrl: 'https://example.com/tools'
    }
  });

  assert.match(result.outputText, /标题：PP 工具站/);
  assert.match(result.outputText, /描述：文件处理与文本处理一站完成/);
  assert.match(result.outputText, /关键词：PDF, 文本工具, 编程工具/);
  assert.match(result.outputText, /Canonical：https:\/\/example\.com\/tools/);
  assert.match(result.outputText, /Robots：index,follow/);
});

test('runTool formats TDK output from page html', async () => {
  const service = createDevToolsService({
    fetchText: async () => `
      <html>
        <head>
          <title>PP 工具站首页</title>
          <meta name="description" content="常用文件处理一站完成">
          <meta name="keywords" content="PDF, Word, PPT">
        </head>
      </html>
    `
  });

  const result = await service.runTool({
    toolKey: 'dev_tdk_check',
    toolOptions: {
      targetUrl: 'https://example.com/'
    }
  });

  assert.match(result.outputText, /Title：PP 工具站首页/);
  assert.match(result.outputText, /Keywords：PDF, Word, PPT/);
  assert.match(result.outputText, /Description：常用文件处理一站完成/);
});

test('runTool calculates keyword density from page text content', async () => {
  const service = createDevToolsService({
    fetchText: async () => `
      <html>
        <body>
          <h1>PDF 工具</h1>
          <p>PDF 工具支持 PDF 合并、PDF 压缩。</p>
          <p>文本工具也能一起使用。</p>
        </body>
      </html>
    `
  });

  const result = await service.runTool({
    toolKey: 'dev_keyword_density_check',
    toolOptions: {
      targetUrl: 'https://example.com/',
      keywordText: 'PDF'
    }
  });

  assert.match(result.outputText, /关键词：PDF/);
  assert.match(result.outputText, /出现次数：4/);
  assert.match(result.outputText, /密度：/);
});

test('runTool formats a spider-style page summary with headings and text preview', async () => {
  const service = createDevToolsService({
    fetchText: async () => `
      <html>
        <head>
          <title>PP 工具站</title>
          <meta name="robots" content="index,follow">
          <link rel="canonical" href="https://example.com/tools">
        </head>
        <body>
          <h1>PP 工具站</h1>
          <h2>编程工具</h2>
          <p>这是一个用于文件处理、文本处理与编程开发辅助的工具站。</p>
        </body>
      </html>
    `
  });

  const result = await service.runTool({
    toolKey: 'dev_spider_preview',
    toolOptions: {
      targetUrl: 'https://example.com/tools'
    }
  });

  assert.match(result.outputText, /标题：PP 工具站/);
  assert.match(result.outputText, /Canonical：https:\/\/example\.com\/tools/);
  assert.match(result.outputText, /Robots：index,follow/);
  assert.match(result.outputText, /标题结构：PP 工具站 \| 编程工具/);
  assert.match(result.outputText, /正文预览：这是一个用于文件处理、文本处理与编程开发辅助的工具站。/);
});

test('runTool generates a php password_hash compatible bcrypt string', async () => {
  const service = createDevToolsService();

  const result = await service.runTool({
    toolKey: 'dev_php_password_hash',
    toolOptions: {
      sourceText: 'OpenAI123',
      passwordHashCost: 10
    }
  });

  assert.match(result.outputText, /^\$2[aby]\$10\$/);
});

test('runTool beautifies and minifies javascript source', async () => {
  const service = createDevToolsService();

  const pretty = await service.runTool({
    toolKey: 'dev_js_format',
    toolOptions: {
      sourceText: 'function sum(a,b){return a+b}',
      formatMode: 'beautify'
    }
  });
  assert.match(pretty.outputText, /function sum\(a, b\) \{/);

  const minified = await service.runTool({
    toolKey: 'dev_js_format',
    toolOptions: {
      sourceText: 'function sum(a, b) {\n  return a + b;\n}',
      formatMode: 'minify'
    }
  });
  assert.match(minified.outputText, /function sum\(n,u\)\{return n\+u\}/);
});

test('runTool beautifies and minifies css source', async () => {
  const service = createDevToolsService();

  const pretty = await service.runTool({
    toolKey: 'dev_css_format',
    toolOptions: {
      sourceText: 'body{color:red;background:#fff}',
      formatMode: 'beautify'
    }
  });
  assert.match(pretty.outputText, /body \{/);

  const minified = await service.runTool({
    toolKey: 'dev_css_format',
    toolOptions: {
      sourceText: 'body { color: red; background: #fff; }',
      formatMode: 'minify'
    }
  });
  assert.equal(minified.outputText, 'body{color:red;background:#fff}');
});

test('runTool beautifies and minifies html source', async () => {
  const service = createDevToolsService();

  const pretty = await service.runTool({
    toolKey: 'dev_html_format',
    toolOptions: {
      sourceText: '<div><span>Hi</span></div>',
      formatMode: 'beautify'
    }
  });
  assert.match(pretty.outputText, /<div>/);
  assert.match(pretty.outputText, /\n\s*<span>Hi<\/span>/);

  const minified = await service.runTool({
    toolKey: 'dev_html_format',
    toolOptions: {
      sourceText: '<div>\n  <span>Hi</span>\n</div>',
      formatMode: 'minify'
    }
  });
  assert.equal(minified.outputText, '<div><span>Hi</span></div>');
});

test('runTool clears style and script content from html source', async () => {
  const service = createDevToolsService();

  const result = await service.runTool({
    toolKey: 'dev_css_js_clear',
    toolOptions: {
      sourceText: '<div style="color:red" onclick="go()"><style>.a{color:red}</style><script>alert(1)</script><span>Hi</span></div>',
      cleanupMode: 'clear_css_js'
    }
  });

  assert.equal(result.outputText, '<div><span>Hi</span></div>');
});

test('runTool returns common dns records for nslookup queries', async () => {
  const service = createDevToolsService({
    nslookupHost: async () => ({
      target: 'example.com',
      aRecords: ['1.1.1.1'],
      cnameRecords: ['alias.example.net'],
      mxRecords: ['10 mail.example.com'],
      nsRecords: ['ns1.example.com', 'ns2.example.com'],
      txtRecords: ['v=spf1 include:example.com ~all']
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_nslookup_query',
    toolOptions: {
      targetUrl: 'example.com'
    }
  });

  assert.match(result.outputText, /查询目标：example\.com/);
  assert.match(result.outputText, /A 记录：1\.1\.1\.1/);
  assert.match(result.outputText, /CNAME 记录：alias\.example\.net/);
  assert.match(result.outputText, /MX 记录：10 mail\.example\.com/);
  assert.match(result.outputText, /TXT 记录：v=spf1 include:example\.com ~all/);
});

test('runTool reverse-resolves an ip address into hostnames', async () => {
  const service = createDevToolsService({
    reverseLookupHost: async () => ({
      ipAddress: '8.8.8.8',
      hostnames: ['dns.google']
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_ip_to_hostname',
    toolOptions: {
      targetUrl: '8.8.8.8'
    }
  });

  assert.match(result.outputText, /IP 地址：8\.8\.8\.8/);
  assert.match(result.outputText, /主机名：dns\.google/);
});

test('runTool reports dead-link status for a url list', async () => {
  const service = createDevToolsService({
    checkDeadLinks: async () => ([
      { url: 'https://a.example.com', status: 200, ok: true },
      { url: 'https://b.example.com', status: 404, ok: false },
      { url: 'https://c.example.com', status: 301, ok: true, redirectUrl: 'https://cdn.example.com' }
    ])
  });

  const result = await service.runTool({
    toolKey: 'dev_dead_link_check',
    toolOptions: {
      sourceText: 'https://a.example.com\nhttps://b.example.com\nhttps://c.example.com'
    }
  });

  assert.match(result.outputText, /200 正常 https:\/\/a\.example\.com/);
  assert.match(result.outputText, /404 死链 https:\/\/b\.example\.com/);
  assert.match(result.outputText, /301 正常 https:\/\/c\.example\.com -> https:\/\/cdn\.example\.com/);
});

test('runTool returns the pem chain for ssl chain download', async () => {
  const service = createDevToolsService({
    fetchCertificateChain: async () => ({
      target: 'example.com:443',
      certificates: [
        {
          subject: 'CN=example.com',
          issuer: 'CN=Example Intermediate CA',
          validTo: '2030-01-01T00:00:00Z',
          pem: '-----BEGIN CERTIFICATE-----\\nLEAF\\n-----END CERTIFICATE-----'
        },
        {
          subject: 'CN=Example Intermediate CA',
          issuer: 'CN=Example Root CA',
          validTo: '2035-01-01T00:00:00Z',
          pem: '-----BEGIN CERTIFICATE-----\\nINTERMEDIATE\\n-----END CERTIFICATE-----'
        }
      ]
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_ssl_chain_download',
    toolOptions: {
      targetUrl: 'https://example.com'
    }
  });

  assert.match(result.outputText, /目标：example\.com:443/);
  assert.match(result.outputText, /证书 1：CN=example\.com/);
  assert.match(result.outputText, /-----BEGIN CERTIFICATE-----\\nLEAF/);
  assert.match(result.outputText, /-----BEGIN CERTIFICATE-----\\nINTERMEDIATE/);
});

test('runTool batch-requests one url multiple times', async () => {
  const service = createDevToolsService({
    batchRequestUrl: async () => ({
      targetUrl: 'https://example.com/ping',
      totalCount: 3,
      successCount: 2,
      failCount: 1,
      responses: [
        { index: 1, status: 200, ok: true, elapsedMs: 34 },
        { index: 2, status: 200, ok: true, elapsedMs: 35 },
        { index: 3, status: 500, ok: false, elapsedMs: 48 }
      ]
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_batch_request',
    toolOptions: {
      targetUrl: 'https://example.com/ping',
      requestCount: 3,
      requestIntervalMs: 100
    }
  });

  assert.match(result.outputText, /目标地址：https:\/\/example\.com\/ping/);
  assert.match(result.outputText, /请求总数：3/);
  assert.match(result.outputText, /成功：2/);
  assert.match(result.outputText, /3\. 500 失败 48ms/);
});

test('runTool batch-requests multiple apis with shared query params', async () => {
  const service = createDevToolsService({
    batchRequestApis: async () => ({
      sharedParams: { token: 'abc', q: 'pdf' },
      responses: [
        { url: 'https://a.example.com/search?token=abc&q=pdf', status: 200, ok: true, bodyPreview: '{"ok":true}' },
        { url: 'https://b.example.com/search?token=abc&q=pdf', status: 404, ok: false, bodyPreview: 'not found' }
      ]
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_api_batch_request',
    toolOptions: {
      sourceText: 'https://a.example.com/search\nhttps://b.example.com/search',
      requestQueryParams: 'token=abc\nq=pdf'
    }
  });

  assert.match(result.outputText, /公共参数：token=abc&q=pdf/);
  assert.match(result.outputText, /200 成功 https:\/\/a\.example\.com\/search\?token=abc&q=pdf/);
  assert.match(result.outputText, /404 失败 https:\/\/b\.example\.com\/search\?token=abc&q=pdf/);
});

test('runTool formats a single icp lookup result', async () => {
  const service = createDevToolsService({
    queryIcpByDomain: async () => ({
      domain: 'baidu.com',
      serviceLicence: '京ICP证030173号-1',
      unitName: '北京百度网讯科技有限公司',
      natureName: '企业'
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_icp_query',
    toolOptions: {
      targetUrl: 'baidu.com'
    }
  });

  assert.match(result.outputText, /域名：baidu\.com/);
  assert.match(result.outputText, /备案号：京ICP证030173号-1/);
  assert.match(result.outputText, /主办单位：北京百度网讯科技有限公司/);
  assert.match(result.outputText, /主办单位性质：企业/);
});

test('runTool formats batch icp lookup results line by line', async () => {
  const service = createDevToolsService({
    batchQueryIcpByDomain: async () => ([
      { input: 'baidu.com', ok: true, domain: 'baidu.com', serviceLicence: '京ICP证030173号-1', unitName: '北京百度网讯科技有限公司', natureName: '企业' },
      { input: 'qq.com', ok: true, domain: 'qq.com', serviceLicence: '粤B2-20090059-5', unitName: '深圳市腾讯计算机系统有限公司', natureName: '企业' },
      { input: 'invalid-domain', ok: false, message: '查询失败' }
    ])
  });

  const result = await service.runTool({
    toolKey: 'dev_icp_batch_query',
    toolOptions: {
      sourceText: 'baidu.com\nqq.com\ninvalid-domain'
    }
  });

  assert.match(result.outputText, /1\. baidu\.com \| 京ICP证030173号-1 \| 北京百度网讯科技有限公司 \| 企业/);
  assert.match(result.outputText, /2\. qq\.com \| 粤B2-20090059-5 \| 深圳市腾讯计算机系统有限公司 \| 企业/);
  assert.match(result.outputText, /3\. invalid-domain \| 查询失败/);
});

test('runTool formats icp reverse lookup results for a subject keyword', async () => {
  const service = createDevToolsService({
    reverseQueryIcpByKeyword: async () => ({
      keyword: '北京百度网讯科技有限公司',
      total: 2,
      list: [
        {
          siteDomain: 'baidu.com',
          serviceLicence: '京ICP证030173号-1',
          icpOrg: '北京百度网讯科技有限公司',
          orgType: '企业'
        },
        {
          siteDomain: 'baifubao.com',
          serviceLicence: '京ICP证030173号-25',
          icpOrg: '北京百度网讯科技有限公司',
          orgType: '企业'
        }
      ]
    })
  });

  const result = await service.runTool({
    toolKey: 'dev_icp_reverse_query',
    toolOptions: {
      sourceText: '北京百度网讯科技有限公司'
    }
  });

  assert.match(result.outputText, /查询关键词：北京百度网讯科技有限公司/);
  assert.match(result.outputText, /结果数量：2/);
  assert.match(result.outputText, /1\. baidu\.com \| 京ICP证030173号-1 \| 北京百度网讯科技有限公司 \| 企业/);
  assert.match(result.outputText, /2\. baifubao\.com \| 京ICP证030173号-25 \| 北京百度网讯科技有限公司 \| 企业/);
});

test('runTool restores a short link to its final target', async () => {
  const service = createDevToolsService({
    traceRedirects: async () => ([
      { url: 'https://t.example/abc', status: 301, location: 'https://example.com/final' },
      { url: 'https://example.com/final', status: 200, location: '' }
    ])
  });

  const result = await service.runTool({
    toolKey: 'dev_short_url_restore',
    toolOptions: {
      targetUrl: 'https://t.example/abc'
    }
  });

  assert.match(result.outputText, /原始短链：https:\/\/t\.example\/abc/);
  assert.match(result.outputText, /最终地址：https:\/\/example\.com\/final/);
});

test('runTool resolves a batch of domains into ip addresses', async () => {
  const service = createDevToolsService({
    lookupDomainIps: async () => ([
      { domain: 'example.com', ipv4: ['1.1.1.1'], ipv6: ['2606:4700:4700::1111'] },
      { domain: 'openai.com', ipv4: ['2.2.2.2'], ipv6: [] }
    ])
  });

  const result = await service.runTool({
    toolKey: 'dev_domain_to_ip_batch',
    toolOptions: {
      sourceText: 'example.com\nopenai.com'
    }
  });

  assert.match(result.outputText, /example\.com \| IPv4: 1\.1\.1\.1 \| IPv6: 2606:4700:4700::1111/);
  assert.match(result.outputText, /openai\.com \| IPv4: 2\.2\.2\.2 \| IPv6: -/);
});

test('runTool resolves whois info for a batch of domains', async () => {
  const service = createDevToolsService({
    lookupWhoisBatch: async () => ([
      { domain: 'example.com', registrar: 'Example Registrar', expirationDate: '2030-01-01T00:00:00Z' },
      { domain: 'openai.com', registrar: 'OpenAI Registrar', expirationDate: '2031-01-01T00:00:00Z' }
    ])
  });

  const result = await service.runTool({
    toolKey: 'dev_whois_batch',
    toolOptions: {
      sourceText: 'example.com\nopenai.com'
    }
  });

  assert.match(result.outputText, /example\.com \| Example Registrar \| 2030-01-01T00:00:00Z/);
  assert.match(result.outputText, /openai\.com \| OpenAI Registrar \| 2031-01-01T00:00:00Z/);
});

test('runTool obfuscates javascript source with a minified output', async () => {
  const service = createDevToolsService();

  const result = await service.runTool({
    toolKey: 'dev_js_obfuscate',
    toolOptions: {
      sourceText: 'function add(a, b) {\n  return a + b;\n}'
    }
  });

  assert.match(result.outputText, /function add\(/);
  assert.doesNotMatch(result.outputText, /\n  return a \+ b;/);
});

test('runTool wraps php source into an obfuscated loader stub', async () => {
  const service = createDevToolsService();

  const result = await service.runTool({
    toolKey: 'dev_php_obfuscate',
    toolOptions: {
      sourceText: '<?php echo "hi";'
    }
  });

  assert.match(result.outputText, /base64_decode/);
  assert.match(result.outputText, /eval\(/);
});

test('runTool minifies javascript through the yui-js alias tool', async () => {
  const service = createDevToolsService();

  const result = await service.runTool({
    toolKey: 'dev_yui_js_minify',
    toolOptions: {
      sourceText: 'function add(a, b) {\n  return a + b;\n}'
    }
  });

  assert.match(result.outputText, /function add\(/);
  assert.doesNotMatch(result.outputText, /\n/);
});

test('runTool minifies css through the yui-css alias tool', async () => {
  const service = createDevToolsService();

  const result = await service.runTool({
    toolKey: 'dev_yui_css_minify',
    toolOptions: {
      sourceText: 'body { color: red; background: #fff; }'
    }
  });

  assert.equal(result.outputText, 'body{color:red;background:#fff}');
});
