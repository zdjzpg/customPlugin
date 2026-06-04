const tls = require('node:tls');
const dns = require('node:dns/promises');
const { X509Certificate } = require('node:crypto');
const bcrypt = require('bcryptjs');
const beautify = require('js-beautify');
const terser = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');

function createDevToolsService(dependencies = {}) {
  const {
    fetchText = defaultFetchText,
    fetchMetadata = defaultFetchMetadata,
    tlsProbe = defaultTlsProbe,
    traceRedirects = defaultTraceRedirects,
    lookupWhois = defaultLookupWhois,
    detectCdn = defaultDetectCdn,
    now = () => new Date(),
    parseCertificate = defaultParseCertificate,
    nslookupHost = defaultNslookupHost,
    reverseLookupHost = defaultReverseLookupHost,
    fetchCertificateChain = defaultFetchCertificateChain,
    checkDeadLinks = defaultCheckDeadLinks,
    batchRequestUrl = defaultBatchRequestUrl,
    batchRequestApis = defaultBatchRequestApis,
    queryIcpByDomain = defaultQueryIcpByDomain,
    batchQueryIcpByDomain = defaultBatchQueryIcpByDomain,
    reverseQueryIcpByKeyword = defaultReverseQueryIcpByKeyword,
    lookupDomainIps = defaultLookupDomainIps,
    lookupWhoisBatch = defaultLookupWhoisBatch,
    passwordHash = defaultPasswordHash,
    formatJavascript = defaultFormatJavascript,
    formatCss = defaultFormatCss,
    formatHtml = defaultFormatHtml,
    clearCssJs = defaultClearCssJs
  } = dependencies;

  return {
    async runTool(input) {
      const toolKey = typeof input?.toolKey === 'string' ? input.toolKey.trim() : '';
      const toolOptions = input?.toolOptions && typeof input.toolOptions === 'object'
        ? input.toolOptions
        : {};
      const targetUrl = normalizeTargetUrl(toolOptions.targetUrl);
      const requiresTargetUrl = [
        'dev_sitemap_extract',
        'dev_html_link_extract',
        'dev_ssl_check',
        'dev_ssl_expiry_check'
      ].includes(toolKey);

      if (requiresTargetUrl && !targetUrl) {
        const error = new Error('请先填写目标地址。');
        error.statusCode = 400;
        error.reason = 'INVALID_DEV_TOOL_OPTIONS';
        throw error;
      }

      if (toolKey === 'dev_sitemap_extract') {
        const xmlText = await fetchText(targetUrl);
        return {
          outputText: extractSitemapLocs(xmlText).join('\n')
        };
      }

      if (toolKey === 'dev_html_link_extract') {
        const htmlText = await fetchText(targetUrl);
        return {
          outputText: extractHtmlLinks(htmlText, targetUrl).join('\n')
        };
      }

      if (toolKey === 'dev_meta_info_check') {
        const htmlText = await fetchText(targetUrl);
        return {
          outputText: formatMetaInfoText(htmlText)
        };
      }

      if (toolKey === 'dev_tdk_check') {
        const htmlText = await fetchText(targetUrl);
        return {
          outputText: formatTdkText(htmlText)
        };
      }

      if (toolKey === 'dev_keyword_density_check') {
        const keywordText = String(toolOptions?.keywordText || '').trim();
        if (!keywordText) {
          const error = new Error('请先填写关键词。');
          error.statusCode = 400;
          error.reason = 'INVALID_DEV_TOOL_OPTIONS';
          throw error;
        }

        const htmlText = await fetchText(targetUrl);
        return {
          outputText: formatKeywordDensityText(htmlText, keywordText)
        };
      }

      if (toolKey === 'dev_spider_preview') {
        const htmlText = await fetchText(targetUrl);
        return {
          outputText: formatSpiderPreviewText(htmlText)
        };
      }

      if (toolKey === 'dev_ssl_check') {
        const certificate = await tlsProbe(targetUrl);
        return {
          outputText: formatCertificateText(targetUrl, certificate)
        };
      }

      if (toolKey === 'dev_ssl_expiry_check') {
        const certificate = await tlsProbe(targetUrl);
        return {
          outputText: formatCertificateExpiryText(targetUrl, certificate, now())
        };
      }

      if (toolKey === 'dev_gzip_check' || toolKey === 'dev_brotli_check') {
        const metadata = await fetchMetadata(targetUrl, toolKey === 'dev_gzip_check' ? 'gzip' : 'br');
        return {
          outputText: formatCompressionCheckText(targetUrl, metadata)
        };
      }

      if (toolKey === 'dev_redirect_analysis') {
        const redirects = await traceRedirects(targetUrl);
        return {
          outputText: formatRedirectAnalysisText(redirects)
        };
      }

      if (toolKey === 'dev_whois_lookup') {
        const whoisInfo = await lookupWhois(targetUrl);
        return {
          outputText: formatWhoisLookupText(whoisInfo)
        };
      }

      if (toolKey === 'dev_cdn_check') {
        const cdnInfo = await detectCdn(targetUrl);
        return {
          outputText: formatCdnCheckText(cdnInfo)
        };
      }

      if (toolKey === 'dev_ssl_cert_parse') {
        const certificateText = String(toolOptions?.certificateText || '').trim();
        if (!certificateText) {
          const error = new Error('请先填写证书内容。');
          error.statusCode = 400;
          error.reason = 'INVALID_DEV_TOOL_OPTIONS';
          throw error;
        }

        const certificate = parseCertificate(certificateText);
        return {
          outputText: formatParsedCertificateText(certificate)
        };
      }

      if (toolKey === 'dev_nslookup_query') {
        return {
          outputText: formatNslookupText(await nslookupHost(toolOptions.targetUrl))
        };
      }

      if (toolKey === 'dev_ip_to_hostname') {
        return {
          outputText: formatReverseLookupText(await reverseLookupHost(toolOptions.targetUrl))
        };
      }

      if (toolKey === 'dev_ssl_chain_download') {
        return {
          outputText: formatCertificateChainText(await fetchCertificateChain(toolOptions.targetUrl))
        };
      }

      if (toolKey === 'dev_dead_link_check') {
        return {
          outputText: formatDeadLinkReportText(await checkDeadLinks(toolOptions.sourceText))
        };
      }

      if (toolKey === 'dev_batch_request') {
        return {
          outputText: formatBatchRequestText(
            await batchRequestUrl(toolOptions.targetUrl, toolOptions.requestCount, toolOptions.requestIntervalMs)
          )
        };
      }

      if (toolKey === 'dev_api_batch_request') {
        return {
          outputText: formatApiBatchRequestText(
            await batchRequestApis(toolOptions.sourceText, toolOptions.requestQueryParams)
          )
        };
      }

      if (toolKey === 'dev_short_url_restore') {
        const redirects = await traceRedirects(targetUrl);
        return {
          outputText: formatShortUrlRestoreText(targetUrl, redirects)
        };
      }

      if (toolKey === 'dev_domain_to_ip_batch') {
        return {
          outputText: formatDomainIpBatchText(await lookupDomainIps(toolOptions.sourceText))
        };
      }

      if (toolKey === 'dev_whois_batch') {
        return {
          outputText: formatWhoisBatchText(await lookupWhoisBatch(toolOptions.sourceText))
        };
      }

      if (toolKey === 'dev_icp_query') {
        return {
          outputText: formatIcpQueryText(await queryIcpByDomain(toolOptions.targetUrl))
        };
      }

      if (toolKey === 'dev_icp_batch_query') {
        return {
          outputText: formatIcpBatchQueryText(await batchQueryIcpByDomain(toolOptions.sourceText))
        };
      }

      if (toolKey === 'dev_icp_reverse_query') {
        return {
          outputText: formatIcpReverseQueryText(await reverseQueryIcpByKeyword(toolOptions.sourceText))
        };
      }

      if (toolKey === 'dev_php_password_hash') {
        const sourceText = String(toolOptions?.sourceText || '');
        if (!sourceText.trim()) {
          const error = new Error('请先填写要哈希的原始文本。');
          error.statusCode = 400;
          error.reason = 'INVALID_DEV_TOOL_OPTIONS';
          throw error;
        }

        return {
          outputText: passwordHash(sourceText, Number.parseInt(toolOptions?.passwordHashCost || '10', 10) || 10)
        };
      }

      if (toolKey === 'dev_js_format') {
        return {
          outputText: await formatJavascript(String(toolOptions?.sourceText || ''), String(toolOptions?.formatMode || 'beautify'))
        };
      }

      if (toolKey === 'dev_css_format') {
        return {
          outputText: formatCss(String(toolOptions?.sourceText || ''), String(toolOptions?.formatMode || 'beautify'))
        };
      }

      if (toolKey === 'dev_html_format') {
        return {
          outputText: await formatHtml(String(toolOptions?.sourceText || ''), String(toolOptions?.formatMode || 'beautify'))
        };
      }

      if (toolKey === 'dev_js_obfuscate' || toolKey === 'dev_yui_js_minify') {
        return {
          outputText: await formatJavascript(String(toolOptions?.sourceText || ''), 'minify')
        };
      }

      if (toolKey === 'dev_yui_css_minify') {
        return {
          outputText: formatCss(String(toolOptions?.sourceText || ''), 'minify')
        };
      }

      if (toolKey === 'dev_php_obfuscate') {
        return {
          outputText: obfuscatePhpCode(String(toolOptions?.sourceText || ''))
        };
      }

      if (toolKey === 'dev_css_js_clear') {
        return {
          outputText: clearCssJs(String(toolOptions?.sourceText || ''), String(toolOptions?.cleanupMode || 'clear_css_js'))
        };
      }

      const error = new Error('当前工具暂未接入。');
      error.statusCode = 400;
      error.reason = 'UNSUPPORTED_DEV_TOOL';
      throw error;
    }
  };
}

async function defaultFetchText(targetUrl) {
  const response = await fetch(targetUrl);
  if (!response.ok) {
    const error = new Error('目标地址暂时无法读取，请确认链接可直接访问。');
    error.statusCode = 400;
    error.reason = 'REMOTE_FETCH_FAILED';
    throw error;
  }

  return response.text();
}

async function defaultFetchMetadata(targetUrl, encodingType) {
  const response = await fetch(targetUrl, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'accept-encoding': encodingType
    }
  });
  if (!response.ok) {
    const error = new Error('目标地址暂时无法读取，请确认链接可直接访问。');
    error.statusCode = 400;
    error.reason = 'REMOTE_FETCH_FAILED';
    throw error;
  }

  return {
    finalUrl: response.url,
    status: response.status,
    contentEncoding: response.headers.get('content-encoding') || '',
    contentLength: response.headers.get('content-length') || ''
  };
}

function defaultTlsProbe(targetUrl) {
  const parsedUrl = new URL(targetUrl);
  const port = parsedUrl.port ? Number.parseInt(parsedUrl.port, 10) : 443;

  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: parsedUrl.hostname,
      port,
      servername: parsedUrl.hostname,
      rejectUnauthorized: false
    }, () => {
      const certificate = socket.getPeerCertificate(true);
      socket.end();
      resolve(certificate);
    });

    socket.on('error', (error) => {
      reject(buildTlsProbeError(error));
    });
  });
}

function buildTlsProbeError(error) {
  const probeError = new Error('目标网站的 SSL 信息暂时无法读取，请确认地址可访问。');
  probeError.statusCode = 400;
  probeError.reason = 'SSL_PROBE_FAILED';
  probeError.cause = error;
  return probeError;
}

async function defaultTraceRedirects(targetUrl) {
  const hops = [];
  let currentUrl = targetUrl;

  for (let index = 0; index < 10; index += 1) {
    const response = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual'
    });
    const location = response.headers.get('location') || '';
    hops.push({
      url: currentUrl,
      status: response.status,
      location: location ? new URL(location, currentUrl).toString() : ''
    });

    if (!location || ![301, 302, 303, 307, 308].includes(response.status)) {
      break;
    }

    currentUrl = new URL(location, currentUrl).toString();
  }

  return hops;
}

async function defaultLookupWhois(targetUrl) {
  const hostname = new URL(targetUrl).hostname;
  const response = await fetch(`https://rdap.org/domain/${hostname}`, {
    method: 'GET',
    redirect: 'follow'
  });
  if (!response.ok) {
    const error = new Error('当前无法查询该域名的 whois 信息，请稍后重试。');
    error.statusCode = 400;
    error.reason = 'WHOIS_LOOKUP_FAILED';
    throw error;
  }

  const body = await response.json();
  const events = Array.isArray(body.events) ? body.events : [];
  const findEvent = (eventName) =>
    events.find((item) => String(item.eventAction || '').toLowerCase() === eventName)?.eventDate || '';

  return {
    domain: body.ldhName || hostname,
    registrar: body.entities?.find((item) =>
      Array.isArray(item.roles) && item.roles.some((role) => String(role).toLowerCase() === 'registrar')
    )?.vcardArray?.[1]?.find((entry) => entry[0] === 'fn')?.[3] || '',
    creationDate: findEvent('registration'),
    expirationDate: findEvent('expiration'),
    nameServers: Array.isArray(body.nameservers) ? body.nameservers.map((item) => item.ldhName).filter(Boolean) : []
  };
}

async function defaultDetectCdn(targetUrl) {
  const hostname = new URL(targetUrl).hostname;
  const cnameChain = [hostname];
  let currentHost = hostname;

  for (let index = 0; index < 5; index += 1) {
    try {
      const cnameResults = await dns.resolveCname(currentHost);
      if (!Array.isArray(cnameResults) || cnameResults.length === 0) {
        break;
      }

      const nextHost = cnameResults[0];
      cnameChain.push(nextHost);
      currentHost = nextHost;
    } catch {
      break;
    }
  }

  const joinedChain = cnameChain.join(' ');
  const providerRules = [
    ['cloudflare', 'Cloudflare'],
    ['cloudfront', 'CloudFront'],
    ['fastly', 'Fastly'],
    ['akamai', 'Akamai'],
    ['cdn20', 'Tencent CDN'],
    ['qiniucdn', 'Qiniu CDN'],
    ['kunlun', 'Alibaba Cloud CDN'],
    ['alicdn', 'Alibaba Cloud CDN']
  ];
  const matchedProvider = providerRules.find(([keyword]) => joinedChain.toLowerCase().includes(keyword));

  return {
    hostname,
    cdnDetected: Boolean(matchedProvider || cnameChain.length > 1),
    providerName: matchedProvider?.[1] || (cnameChain.length > 1 ? '疑似第三方 CDN' : '未识别'),
    cnameChain
  };
}

function normalizeTargetUrl(value) {
  const rawValue = typeof value === 'string' ? value.trim() : '';
  if (!rawValue) {
    return '';
  }

  try {
    return new URL(rawValue).toString();
  } catch {
    try {
      return new URL(`https://${rawValue}`).toString();
    } catch {
      return '';
    }
  }
}

function extractSitemapLocs(xmlText) {
  const matches = Array.from(String(xmlText || '').matchAll(/<loc>([\s\S]*?)<\/loc>/gi));
  return uniqueValues(matches.map((match) => decodeXmlEntities(match[1].trim())).filter(Boolean));
}

function extractHtmlLinks(htmlText, baseUrl) {
  const matches = Array.from(String(htmlText || '').matchAll(/href\s*=\s*["']([^"'#]+)["']/gi));
  return uniqueValues(
    matches
      .map((match) => toAbsoluteUrl(match[1].trim(), baseUrl))
      .filter(Boolean)
  );
}

function decodeXmlEntities(text) {
  return String(text)
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function toAbsoluteUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function uniqueValues(values) {
  return Array.from(new Set(values));
}

function formatCertificateText(targetUrl, certificate) {
  const lines = [
    `检测地址：${targetUrl}`,
    `证书主题：${certificate?.subject?.CN || '-'}`,
    `签发机构：${certificate?.issuer?.O || certificate?.issuer?.CN || '-'}`,
    `生效时间：${certificate?.valid_from || '-'}`,
    `到期时间：${certificate?.valid_to || '-'}`,
    `备用域名：${certificate?.subjectaltname || '-'}`
  ];

  return lines.join('\n');
}

function formatCertificateExpiryText(targetUrl, certificate, currentDate) {
  const expiryText = certificate?.valid_to || '-';
  const expiryDate = expiryText === '-' ? null : new Date(expiryText);
  const remainingDays = expiryDate && !Number.isNaN(expiryDate.getTime())
    ? Math.max(0, Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000)))
    : '-';

  return [
    `检测地址：${targetUrl}`,
    `证书主题：${certificate?.subject?.CN || '-'}`,
    `签发机构：${certificate?.issuer?.O || certificate?.issuer?.CN || '-'}`,
    `到期时间：${expiryText}`,
    `剩余天数：${remainingDays}`
  ].join('\n');
}

function defaultParseCertificate(certificateText) {
  const normalizedText = String(certificateText || '').trim();
  const certificateInput = normalizedText.includes('BEGIN CERTIFICATE')
    ? normalizedText
    : Buffer.from(normalizedText, 'base64');
  const certificate = new X509Certificate(certificateInput);
  return {
    subject: certificate.subject,
    issuer: certificate.issuer,
    validFrom: certificate.validFrom,
    validTo: certificate.validTo
  };
}

function formatParsedCertificateText(certificate) {
  return [
    `证书主题：${certificate?.subject || '-'}`,
    `签发机构：${certificate?.issuer || '-'}`,
    `生效时间：${certificate?.validFrom || '-'}`,
    `到期时间：${certificate?.validTo || '-'}`
  ].join('\n');
}

function formatCompressionCheckText(targetUrl, metadata) {
  return [
    `检测地址：${metadata?.finalUrl || targetUrl}`,
    `HTTP 状态：${metadata?.status || '-'}`,
    `压缩算法：${metadata?.contentEncoding || '未启用'}`,
    `Content-Length：${metadata?.contentLength || '-'}`
  ].join('\n');
}

async function defaultNslookupHost(targetInput) {
  const hostname = normalizeHostInput(targetInput);
  if (!hostname) {
    throwInvalidToolOptions('请先填写域名。');
  }

  const [aRecords, cnameRecords, mxRecords, nsRecords, txtRecords] = await Promise.all([
    resolveDnsSafely(() => dns.resolve4(hostname)),
    resolveDnsSafely(() => dns.resolveCname(hostname)),
    resolveDnsSafely(() => dns.resolveMx(hostname)),
    resolveDnsSafely(() => dns.resolveNs(hostname)),
    resolveDnsSafely(() => dns.resolveTxt(hostname))
  ]);

  return {
    target: hostname,
    aRecords,
    cnameRecords,
    mxRecords: mxRecords.map((item) => `${item.priority} ${item.exchange}`),
    nsRecords,
    txtRecords: txtRecords.map((item) => item.join(''))
  };
}

async function defaultReverseLookupHost(targetInput) {
  const ipAddress = normalizeIpInput(targetInput);
  if (!ipAddress) {
    throwInvalidToolOptions('请先填写 IP 地址。');
  }

  const hostnames = await resolveDnsSafely(() => dns.reverse(ipAddress));
  return {
    ipAddress,
    hostnames
  };
}

async function defaultFetchCertificateChain(targetInput) {
  const { hostname, port } = normalizeHostPortInput(targetInput);
  if (!hostname) {
    throwInvalidToolOptions('请先填写目标地址。');
  }

  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: hostname,
      port,
      servername: hostname,
      rejectUnauthorized: false
    }, () => {
      const certificate = socket.getPeerCertificate(true);
      socket.end();
      resolve({
        target: `${hostname}:${port}`,
        certificates: collectCertificateChain(certificate)
      });
    });

    socket.on('error', (error) => {
      const chainError = new Error('目标网站的证书链暂时无法读取，请确认地址可访问。');
      chainError.statusCode = 400;
      chainError.reason = 'SSL_CHAIN_FETCH_FAILED';
      chainError.cause = error;
      reject(chainError);
    });
  });
}

async function defaultCheckDeadLinks(sourceText) {
  const urls = splitNonEmptyLines(sourceText);
  if (urls.length === 0) {
    throwInvalidToolOptions('请先填写 URL 列表。');
  }

  const results = [];
  for (const rawUrl of urls) {
    const targetUrl = normalizeTargetUrl(rawUrl);
    if (!targetUrl) {
      results.push({ url: rawUrl, status: 0, ok: false, invalid: true });
      continue;
    }

    try {
      let response = await fetch(targetUrl, { method: 'HEAD', redirect: 'manual' });
      if (response.status === 405) {
        response = await fetch(targetUrl, { method: 'GET', redirect: 'manual' });
      }
      results.push({
        url: targetUrl,
        status: response.status,
        ok: response.status < 400,
        redirectUrl: response.headers.get('location')
          ? new URL(response.headers.get('location'), targetUrl).toString()
          : ''
      });
    } catch {
      results.push({ url: targetUrl, status: 0, ok: false });
    }
  }

  return results;
}

async function defaultBatchRequestUrl(targetInput, countValue, intervalValue) {
  const targetUrl = normalizeTargetUrl(targetInput);
  if (!targetUrl) {
    throwInvalidToolOptions('请先填写目标地址。');
  }

  const totalCount = Math.min(Math.max(Number.parseInt(String(countValue || '10'), 10) || 10, 1), 50);
  const intervalMs = Math.min(Math.max(Number.parseInt(String(intervalValue || '300'), 10) || 0, 0), 10000);
  const responses = [];

  for (let index = 0; index < totalCount; index += 1) {
    const startAt = Date.now();
    try {
      const response = await fetch(targetUrl, { method: 'GET', redirect: 'manual' });
      responses.push({
        index: index + 1,
        status: response.status,
        ok: response.status < 400,
        elapsedMs: Date.now() - startAt
      });
    } catch {
      responses.push({
        index: index + 1,
        status: 0,
        ok: false,
        elapsedMs: Date.now() - startAt
      });
    }

    if (intervalMs > 0 && index < totalCount - 1) {
      await sleep(intervalMs);
    }
  }

  return {
    targetUrl,
    totalCount,
    successCount: responses.filter((item) => item.ok).length,
    failCount: responses.filter((item) => !item.ok).length,
    responses
  };
}

async function defaultBatchRequestApis(sourceText, queryParamsText) {
  const baseUrls = splitNonEmptyLines(sourceText);
  if (baseUrls.length === 0) {
    throwInvalidToolOptions('请先填写 API 列表。');
  }

  const sharedParams = parseKeyValueLines(queryParamsText);
  const queryString = new URLSearchParams(sharedParams).toString();
  const responses = [];

  for (const baseUrl of baseUrls) {
    const targetUrl = appendQueryParams(baseUrl, queryString);
    try {
      const response = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
      const bodyPreview = await safeReadTextPreview(response);
      responses.push({
        url: targetUrl,
        status: response.status,
        ok: response.status < 400,
        bodyPreview
      });
    } catch {
      responses.push({
        url: targetUrl,
        status: 0,
        ok: false,
        bodyPreview: ''
      });
    }
  }

  return {
    sharedParams,
    responses
  };
}

async function defaultLookupDomainIps(sourceText) {
  const domains = splitNonEmptyLines(sourceText);
  if (domains.length === 0) {
    throwInvalidToolOptions('请先填写域名列表。');
  }

  const results = [];
  for (const domainText of domains.slice(0, 50)) {
    const domain = normalizeHostInput(domainText);
    const [ipv4, ipv6] = await Promise.all([
      resolveDnsSafely(() => dns.resolve4(domain)),
      resolveDnsSafely(() => dns.resolve6(domain))
    ]);
    results.push({
      domain,
      ipv4,
      ipv6
    });
  }

  return results;
}

async function defaultLookupWhoisBatch(sourceText) {
  const domains = splitNonEmptyLines(sourceText);
  if (domains.length === 0) {
    throwInvalidToolOptions('请先填写域名列表。');
  }

  const results = [];
  for (const domainText of domains.slice(0, 30)) {
    const domain = normalizeHostInput(domainText);
    try {
      const info = await defaultLookupWhois(`https://${domain}`);
      results.push({
        domain,
        registrar: info.registrar || '-',
        expirationDate: info.expirationDate || '-'
      });
    } catch {
      results.push({
        domain,
        registrar: '-',
        expirationDate: '-'
      });
    }
  }

  return results;
}

async function defaultQueryIcpByDomain(targetInput) {
  const domain = normalizeHostInput(targetInput);
  if (!domain) {
    throwInvalidToolOptions('请先填写域名。');
  }

  const response = await fetch('https://www.lanren-tools.com/icp/queryIcpByDomain', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({ domain })
  });

  if (!response.ok) {
    throwUpstreamIcpError('ICP备案查询暂时不可用，请稍后重试。', 'ICP_QUERY_UPSTREAM_FAILED');
  }

  const body = await response.json();
  if (body?.code !== 200 || !body?.data) {
    throwUpstreamIcpError(body?.msg || '未查询到备案信息。', 'ICP_QUERY_UPSTREAM_FAILED');
  }

  return {
    domain: body.data.domain || domain,
    serviceLicence: body.data.serviceLicence || '--',
    unitName: body.data.unitName || '--',
    natureName: body.data.natureName || '--'
  };
}

async function defaultBatchQueryIcpByDomain(sourceText) {
  const domains = splitNonEmptyLines(sourceText);
  if (domains.length === 0) {
    throwInvalidToolOptions('请先填写域名列表。');
  }

  const limitedDomains = domains.slice(0, 20);
  const results = [];
  for (const domain of limitedDomains) {
    try {
      const result = await defaultQueryIcpByDomain(domain);
      results.push({
        input: domain,
        ok: true,
        ...result
      });
    } catch (error) {
      results.push({
        input: domain,
        ok: false,
        message: error.message || '查询失败'
      });
    }
  }

  return results;
}

async function defaultReverseQueryIcpByKeyword(sourceText) {
  const keyword = String(sourceText || '').trim();
  if (!keyword) {
    throwInvalidToolOptions('请先填写备案主体。');
  }

  const response = await fetch('https://api.uutool.cn/icp/search/', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      origin: 'https://uutool.cn',
      referer: 'https://uutool.cn/icp-search/'
    },
    body: new URLSearchParams({
      keyword
    }).toString()
  });

  if (!response.ok) {
    throwUpstreamIcpError('ICP备案反查暂时不可用，请稍后重试。', 'ICP_REVERSE_UPSTREAM_FAILED');
  }

  const body = await response.json();
  if (body?.status !== 1 || !Array.isArray(body?.data)) {
    throwUpstreamIcpError(body?.error || 'ICP备案反查暂时不可用，请稍后重试。', 'ICP_REVERSE_UPSTREAM_FAILED');
  }

  return {
    keyword,
    total: body.data.length,
    list: body.data.map((item) => ({
      siteDomain: item.site_domain || item.siteDomain || '',
      serviceLicence: item.icp_no || item.service_licence || item.serviceLicence || '',
      icpOrg: item.icp_org || item.unit_name || item.unitName || '',
      orgType: item.org_type || item.nature_name || item.natureName || ''
    }))
  };
}

function defaultPasswordHash(sourceText, cost) {
  const normalizedCost = Math.min(Math.max(Number.parseInt(String(cost || '10'), 10) || 10, 4), 15);
  return bcrypt.hashSync(sourceText, normalizedCost);
}

async function defaultFormatJavascript(sourceText, mode) {
  if (mode === 'minify') {
    const result = await terser.minify(sourceText, {
      compress: true,
      mangle: true,
      format: {
        comments: false
      }
    });
    return result.code || '';
  }

  return beautify.js(String(sourceText || ''), {
    indent_size: 2,
    space_in_empty_paren: false
  });
}

function defaultFormatCss(sourceText, mode) {
  if (mode === 'minify') {
    return new CleanCSS({ level: 2 }).minify(sourceText).styles || '';
  }

  return beautify.css(String(sourceText || ''), {
    indent_size: 2
  });
}

async function defaultFormatHtml(sourceText, mode) {
  if (mode === 'minify') {
    return minifyHtml(String(sourceText || ''), {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    });
  }

  const prettyHtml = beautify.html(String(sourceText || ''), {
    indent_size: 2,
    preserve_newlines: true
  });

  return prettyHtml.includes('\n')
    ? prettyHtml
    : prettyHtml.replace(/></g, '>\n<');
}

function defaultClearCssJs(sourceText, cleanupMode) {
  let outputText = String(sourceText || '');

  if (cleanupMode === 'clear_css' || cleanupMode === 'clear_css_js') {
    outputText = outputText
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/\sstyle=(['"]).*?\1/gi, '');
  }

  if (cleanupMode === 'clear_js' || cleanupMode === 'clear_css_js') {
    outputText = outputText
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\son[a-z]+=(['"]).*?\1/gi, '');
  }

  return outputText
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function obfuscatePhpCode(sourceText) {
  const base64Code = Buffer.from(String(sourceText || ''), 'utf8').toString('base64');
  return `<?php\n$payload = '${base64Code}';\neval(base64_decode($payload));\n`;
}

function formatNslookupText(result) {
  return [
    `查询目标：${result.target}`,
    `A 记录：${result.aRecords.length > 0 ? result.aRecords.join(', ') : '-'}`,
    `CNAME 记录：${result.cnameRecords.length > 0 ? result.cnameRecords.join(', ') : '-'}`,
    `MX 记录：${result.mxRecords.length > 0 ? result.mxRecords.join(', ') : '-'}`,
    `NS 记录：${result.nsRecords.length > 0 ? result.nsRecords.join(', ') : '-'}`,
    `TXT 记录：${result.txtRecords.length > 0 ? result.txtRecords.join(' | ') : '-'}`
  ].join('\n');
}

function formatReverseLookupText(result) {
  return [
    `IP 地址：${result.ipAddress}`,
    `主机名：${result.hostnames.length > 0 ? result.hostnames.join(', ') : '无结果'}`
  ].join('\n');
}

function formatCertificateChainText(result) {
  const lines = [`目标：${result.target}`];
  result.certificates.forEach((item, index) => {
    lines.push(
      `证书 ${index + 1}：${item.subject}`,
      `签发者：${item.issuer}`,
      `到期时间：${item.validTo}`,
      item.pem
    );
  });
  return lines.join('\n');
}

function formatDeadLinkReportText(results) {
  return results.map((item) => {
    if (item.invalid) {
      return `0 死链 ${item.url}`;
    }
    const statusLabel = item.ok ? '正常' : '死链';
    return item.redirectUrl
      ? `${item.status} ${statusLabel} ${item.url} -> ${item.redirectUrl}`
      : `${item.status} ${statusLabel} ${item.url}`;
  }).join('\n');
}

function formatBatchRequestText(result) {
  return [
    `目标地址：${result.targetUrl}`,
    `请求总数：${result.totalCount}`,
    `成功：${result.successCount}`,
    `失败：${result.failCount}`,
    ...result.responses.map((item) => `${item.index}. ${item.status} ${item.ok ? '成功' : '失败'} ${item.elapsedMs}ms`)
  ].join('\n');
}

function formatApiBatchRequestText(result) {
  const queryString = new URLSearchParams(result.sharedParams).toString();
  return [
    `公共参数：${queryString || '-'}`,
    ...result.responses.map((item) => `${item.status} ${item.ok ? '成功' : '失败'} ${item.url}${item.bodyPreview ? ` => ${item.bodyPreview}` : ''}`)
  ].join('\n');
}

function formatShortUrlRestoreText(originalUrl, redirects) {
  const finalUrl = redirects.length > 0
    ? (redirects[redirects.length - 1].location || redirects[redirects.length - 1].url)
    : originalUrl;

  return [
    `原始短链：${originalUrl}`,
    `最终地址：${finalUrl}`
  ].join('\n');
}

function formatDomainIpBatchText(results) {
  return results.map((item) =>
    `${item.domain} | IPv4: ${item.ipv4.length > 0 ? item.ipv4.join(', ') : '-'} | IPv6: ${item.ipv6.length > 0 ? item.ipv6.join(', ') : '-'}`
  ).join('\n');
}

function formatWhoisBatchText(results) {
  return results.map((item) =>
    `${item.domain} | ${item.registrar} | ${item.expirationDate}`
  ).join('\n');
}

function formatIcpQueryText(result) {
  return [
    `域名：${result.domain}`,
    `备案号：${result.serviceLicence}`,
    `主办单位：${result.unitName}`,
    `主办单位性质：${result.natureName}`
  ].join('\n');
}

function formatIcpBatchQueryText(results) {
  return results.map((item, index) =>
    item.ok
      ? `${index + 1}. ${item.domain} | ${item.serviceLicence} | ${item.unitName} | ${item.natureName}`
      : `${index + 1}. ${item.input} | ${item.message}`
  ).join('\n');
}

function formatIcpReverseQueryText(result) {
  return [
    `查询关键词：${result.keyword}`,
    `结果数量：${result.total}`,
    ...result.list.map((item, index) =>
      `${index + 1}. ${item.siteDomain} | ${item.serviceLicence} | ${item.icpOrg} | ${item.orgType}`
    )
  ].join('\n');
}

function formatRedirectAnalysisText(redirects) {
  return redirects
    .map((item, index) =>
      item.location
        ? `${index + 1}. ${item.status} ${item.url} -> ${item.location}`
        : `${index + 1}. ${item.status} ${item.url}`
    )
    .join('\n');
}

function formatWhoisLookupText(whoisInfo) {
  return [
    `域名：${whoisInfo?.domain || '-'}`,
    `注册商：${whoisInfo?.registrar || '-'}`,
    `创建时间：${whoisInfo?.creationDate || '-'}`,
    `到期时间：${whoisInfo?.expirationDate || '-'}`,
    `Name Server：${Array.isArray(whoisInfo?.nameServers) && whoisInfo.nameServers.length > 0 ? whoisInfo.nameServers.join(', ') : '-'}`
  ].join('\n');
}

function formatCdnCheckText(cdnInfo) {
  return [
    `检测地址：${cdnInfo?.hostname || '-'}`,
    `是否命中 CDN：${cdnInfo?.cdnDetected ? '是' : '否'}`,
    `识别厂商：${cdnInfo?.providerName || '-'}`,
    `CNAME 链：${Array.isArray(cdnInfo?.cnameChain) && cdnInfo.cnameChain.length > 0 ? cdnInfo.cnameChain.join(' -> ') : '-'}`
  ].join('\n');
}

function formatMetaInfoText(htmlText) {
  return [
    `标题：${extractTitle(htmlText) || '-'}`,
    `描述：${extractMetaContent(htmlText, 'description') || '-'}`,
    `关键词：${extractMetaContent(htmlText, 'keywords') || '-'}`,
    `Canonical：${extractCanonicalLink(htmlText) || '-'}`,
    `Robots：${extractMetaContent(htmlText, 'robots') || '-'}`
  ].join('\n');
}

function formatTdkText(htmlText) {
  return [
    `Title：${extractTitle(htmlText) || '-'}`,
    `Keywords：${extractMetaContent(htmlText, 'keywords') || '-'}`,
    `Description：${extractMetaContent(htmlText, 'description') || '-'}`
  ].join('\n');
}

function formatKeywordDensityText(htmlText, keywordText) {
  const bodyText = stripHtmlToText(htmlText);
  const normalizedText = bodyText.replace(/\s+/g, '');
  const normalizedKeyword = keywordText.replace(/\s+/g, '');
  const matchCount = countKeywordOccurrences(normalizedText, normalizedKeyword);
  const density = normalizedText.length > 0
    ? ((matchCount * normalizedKeyword.length) / normalizedText.length) * 100
    : 0;

  return [
    `关键词：${keywordText}`,
    `出现次数：${matchCount}`,
    `密度：${density.toFixed(2)}%`
  ].join('\n');
}

function formatSpiderPreviewText(htmlText) {
  const previewText = extractBodyPreviewText(htmlText);
  const headingText = extractHeadingTexts(htmlText).join(' | ');

  return [
    `标题：${extractTitle(htmlText) || '-'}`,
    `Canonical：${extractCanonicalLink(htmlText) || '-'}`,
    `Robots：${extractMetaContent(htmlText, 'robots') || '-'}`,
    `标题结构：${headingText || '-'}`,
    `正文预览：${previewText.slice(0, 160) || '-'}`
  ].join('\n');
}

function extractTitle(htmlText) {
  const match = String(htmlText || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeXmlEntities(stripHtmlToText(match[1])) : '';
}

function extractMetaContent(htmlText, name) {
  const matcher = new RegExp(`<meta[^>]+name=["']${escapeRegExp(name)}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`, 'i');
  const match = String(htmlText || '').match(matcher);
  return match ? decodeXmlEntities(match[1].trim()) : '';
}

function extractCanonicalLink(htmlText) {
  const match = String(htmlText || '').match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([\s\S]*?)["'][^>]*>/i);
  return match ? decodeXmlEntities(match[1].trim()) : '';
}

function stripHtmlToText(htmlText) {
  return decodeXmlEntities(
    String(htmlText || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function extractHeadingTexts(htmlText) {
  const matches = Array.from(String(htmlText || '').matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi));
  return matches
    .map((match) => stripHtmlToText(match[1]).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractBodyPreviewText(htmlText) {
  const bodyMatch = String(htmlText || '').match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : String(htmlText || '');
  const withoutHeadings = bodyHtml.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, ' ');
  return stripHtmlToText(withoutHeadings).replace(/\s+/g, ' ').trim();
}

function countKeywordOccurrences(text, keyword) {
  if (!keyword) {
    return 0;
  }

  let count = 0;
  let startIndex = 0;
  while (true) {
    const index = text.indexOf(keyword, startIndex);
    if (index === -1) {
      break;
    }

    count += 1;
    startIndex = index + keyword.length;
  }

  return count;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeHostInput(value) {
  const rawValue = typeof value === 'string' ? value.trim() : '';
  if (!rawValue) {
    return '';
  }

  try {
    return new URL(rawValue.includes('://') ? rawValue : `https://${rawValue}`).hostname;
  } catch {
    return rawValue.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  }
}

function normalizeIpInput(value) {
  const candidate = normalizeHostInput(value);
  return candidate;
}

function normalizeHostPortInput(value) {
  const rawValue = typeof value === 'string' ? value.trim() : '';
  if (!rawValue) {
    return { hostname: '', port: 443 };
  }

  try {
    const parsedUrl = new URL(rawValue.includes('://') ? rawValue : `https://${rawValue}`);
    return {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port ? Number.parseInt(parsedUrl.port, 10) : 443
    };
  } catch {
    const [hostname, portText] = rawValue.split(':');
    return {
      hostname: hostname || '',
      port: portText ? Number.parseInt(portText, 10) || 443 : 443
    };
  }
}

async function resolveDnsSafely(resolver) {
  try {
    const result = await resolver();
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

function collectCertificateChain(certificate) {
  const chain = [];
  let current = certificate;

  while (current && current.raw && !chain.some((item) => item.pem === bufferToPem('CERTIFICATE', current.raw))) {
    chain.push({
      subject: current.subject || '-',
      issuer: current.issuer || '-',
      validTo: current.valid_to || '-',
      pem: bufferToPem('CERTIFICATE', current.raw)
    });

    if (!current.issuerCertificate || current.issuerCertificate === current) {
      break;
    }

    current = current.issuerCertificate;
  }

  return chain;
}

function bufferToPem(label, buffer) {
  const base64 = Buffer.from(buffer).toString('base64');
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

function splitNonEmptyLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseKeyValueLines(text) {
  const entries = {};
  for (const line of splitNonEmptyLines(text)) {
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      entries[key] = value;
    }
  }
  return entries;
}

function appendQueryParams(baseUrl, queryString) {
  const targetUrl = normalizeTargetUrl(baseUrl);
  if (!targetUrl) {
    return baseUrl;
  }

  if (!queryString) {
    return targetUrl;
  }

  return `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}${queryString}`;
}

async function safeReadTextPreview(response) {
  try {
    const text = await response.text();
    return String(text).trim().slice(0, 80);
  } catch {
    return '';
  }
}

function sleep(durationMs) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function throwInvalidToolOptions(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.reason = 'INVALID_DEV_TOOL_OPTIONS';
  throw error;
}

function throwUpstreamIcpError(message, reason) {
  const error = new Error(message);
  error.statusCode = 400;
  error.reason = reason;
  throw error;
}

module.exports = {
  createDevToolsService
};
