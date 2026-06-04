export async function runDevTool(toolKey, input) {
  const sourceText = String(input?.sourceText || '');

  if (toolKey === 'dev_base64_codec') {
    const base64Mode = String(input?.base64Mode || 'encode');
    return {
      outputText: base64Mode === 'decode'
        ? decodeBase64Text(sourceText)
        : encodeBase64Text(sourceText)
    };
  }

  if (toolKey === 'dev_unicode_encode') {
    return {
      outputText: Array.from(sourceText)
        .map((char) => `\\u${char.codePointAt(0).toString(16).padStart(4, '0')}`)
        .join('')
    };
  }

  if (toolKey === 'dev_unicode_decode') {
    return {
      outputText: sourceText.replace(/\\u([0-9a-fA-F]{4})/g, (_match, codePoint) =>
        String.fromCodePoint(Number.parseInt(codePoint, 16)))
    };
  }

  if (toolKey === 'dev_halfwidth_to_fullwidth') {
    return {
      outputText: Array.from(sourceText).map(toFullWidthChar).join('')
    };
  }

  if (toolKey === 'dev_fullwidth_to_halfwidth') {
    return {
      outputText: Array.from(sourceText).map(toHalfWidthChar).join('')
    };
  }

  if (toolKey === 'dev_decimal_unicode_encode') {
    return {
      outputText: Array.from(sourceText)
        .map((char) => String(char.codePointAt(0)))
        .join('\n')
    };
  }

  if (toolKey === 'dev_url_codec') {
    const urlMode = String(input?.urlMode || 'encode');
    return {
      outputText: urlMode === 'decode'
        ? decodeURIComponent(sourceText)
        : encodeURIComponent(sourceText)
    };
  }

  if (toolKey === 'dev_basic_auth_credential') {
    const username = String(input?.basicAuthUsername || '');
    const password = String(input?.basicAuthPassword || '');
    const credential = `${username}:${password}`;
    const bytes = new TextEncoder().encode(credential);
    return {
      outputText: `Basic ${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))}`
    };
  }

  if (toolKey === 'dev_md5_hash') {
    return {
      outputText: md5Hex(sourceText)
    };
  }

  if (toolKey === 'dev_md5_batch') {
    return {
      outputText: splitNonEmptyLines(sourceText)
        .map((line) => md5Hex(line))
        .join('\n')
    };
  }

  if (toolKey === 'dev_string_hash') {
    const hashAlgorithm = String(input?.hashAlgorithm || 'sha256').toLowerCase();
    return {
      outputText: hashAlgorithm === 'md5'
        ? md5Hex(sourceText)
        : await digestHex(sourceText, hashAlgorithm)
    };
  }

  if (toolKey === 'dev_timestamp_convert') {
    const timestampMode = String(input?.timestampMode || 'to_readable');
    return {
      outputText: timestampMode === 'to_timestamp'
        ? convertDateTextToTimestamps(sourceText)
        : convertTimestampToReadableText(sourceText)
    };
  }

  if (toolKey === 'dev_crontab_parse') {
    const cronStartTime = String(input?.cronStartTime || '').trim();
    return {
      outputText: formatCronSchedule(sourceText, cronStartTime)
    };
  }

  if (toolKey === 'dev_radix_convert') {
    const fromBase = toBaseValue(input?.fromBase, 10);
    const toBase = toBaseValue(input?.toBase, 16);
    return {
      outputText: convertRadixText(sourceText, fromBase, toBase)
    };
  }

  if (toolKey === 'dev_text_to_base_n') {
    const codeBase = toBaseValue(input?.codeBase, 16);
    return {
      outputText: Array.from(sourceText)
        .map((char) => char.codePointAt(0).toString(codeBase))
        .join(' ')
    };
  }

  if (toolKey === 'dev_base_n_to_text') {
    const codeBase = toBaseValue(input?.codeBase, 16);
    return {
      outputText: splitBaseTokens(sourceText)
        .map((token) => String.fromCodePoint(parseInt(token, codeBase)))
        .join('')
    };
  }

  if (toolKey === 'dev_html_to_js_string') {
    return {
      outputText: JSON.stringify(sourceText)
    };
  }

  if (toolKey === 'dev_strip_html_tags') {
    return {
      outputText: stripHtmlToPlainText(sourceText)
    };
  }

  if (toolKey === 'dev_newline_to_br') {
    return {
      outputText: String(sourceText).replace(/\r?\n/g, '<br>\n')
    };
  }

  if (toolKey === 'dev_svg_to_datauri') {
    return {
      outputText: `data:image/svg+xml,${encodeSvgDataUri(sourceText)}`
    };
  }

  if (toolKey === 'dev_html_preview') {
    return {
      outputText: sourceText
    };
  }

  if (toolKey === 'dev_urls_to_sitemap') {
    const urls = splitNonEmptyLines(sourceText);
    return {
      outputText: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
        '</urlset>'
      ].join('\n')
    };
  }

  if (toolKey === 'dev_robots_generate') {
    const robotsUserAgent = String(input?.robotsUserAgent || '*').trim() || '*';
    const robotsAllow = String(input?.robotsAllow || '').trim();
    const robotsDisallowLines = splitNonEmptyLines(String(input?.robotsDisallow || ''));
    const robotsSitemap = String(input?.robotsSitemap || '').trim();
    const lines = [`User-agent: ${robotsUserAgent}`];
    if (robotsAllow) {
      lines.push(`Allow: ${robotsAllow}`);
    }
    for (const line of robotsDisallowLines) {
      lines.push(`Disallow: ${line}`);
    }
    if (robotsSitemap) {
      lines.push(`Sitemap: ${robotsSitemap}`);
    }
    return {
      outputText: lines.join('\n')
    };
  }

  if (toolKey === 'dev_browser_ua_info') {
    return {
      outputText: [
        `User-Agent：${String(input?.browserUserAgent || '')}`,
        `平台：${String(input?.browserPlatform || '')}`,
        `语言：${String(input?.browserLanguage || '')}`
      ].join('\n')
    };
  }

  if (toolKey === 'dev_screen_info') {
    const screenInfo = input?.screenInfo || {};
    return {
      outputText: [
        `屏幕分辨率：${screenInfo.width || 0} x ${screenInfo.height || 0}`,
        `可用区域：${screenInfo.availWidth || 0} x ${screenInfo.availHeight || 0}`,
        `设备像素比：${screenInfo.devicePixelRatio || 1}`
      ].join('\n')
    };
  }

  if (toolKey === 'dev_html_entity_codec') {
    const htmlEntityMode = String(input?.htmlEntityMode || 'encode');
    return {
      outputText: htmlEntityMode === 'decode'
        ? decodeHtmlEntities(sourceText)
        : encodeHtmlEntities(sourceText)
    };
  }

  if (toolKey === 'dev_http_headers_to_json') {
    return {
      outputText: JSON.stringify(parseHttpHeaders(sourceText), null, 2)
    };
  }

  if (toolKey === 'dev_cookie_to_json') {
    return {
      outputText: JSON.stringify(parseCookieText(sourceText), null, 2)
    };
  }

  if (toolKey === 'dev_json_format') {
    try {
      return {
        outputText: JSON.stringify(JSON.parse(sourceText), null, 2)
      };
    } catch {
      throw new Error('JSON 格式不正确，请检查后重试。');
    }
  }

  if (toolKey === 'dev_list_to_json') {
    const jsonFieldName = String(input?.jsonFieldName || '').trim();
    const lines = splitNonEmptyLines(sourceText);
    const payload = jsonFieldName
      ? lines.map((line) => ({ [jsonFieldName]: line }))
      : lines;
    return {
      outputText: JSON.stringify(payload, null, 2)
    };
  }

  if (toolKey === 'dev_json_to_list') {
    const items = parseJsonArray(sourceText);
    const jsonPath = String(input?.jsonPath || '').trim();
    const values = items
      .map((item) => jsonPath ? readJsonPath(item, jsonPath) : item)
      .filter((value) => typeof value !== 'undefined' && value !== null)
      .map((value) => typeof value === 'string' ? value : JSON.stringify(value));
    return {
      outputText: values.join('\n')
    };
  }

  if (toolKey === 'dev_json_field_extract') {
    const jsonPath = String(input?.jsonPath || '').trim();
    if (!jsonPath) {
      throw new Error('请先填写字段路径。');
    }

    const parsed = parseJsonValue(sourceText);
    const result = readJsonPath(parsed, jsonPath);
    return {
      outputText: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    };
  }

  if (toolKey === 'dev_json_string_to_number') {
    const parsed = parseJsonValue(sourceText);
    return {
      outputText: JSON.stringify(convertJsonStringNumbers(parsed), null, 2)
    };
  }

  if (toolKey === 'dev_json_number_to_string') {
    const parsed = parseJsonValue(sourceText);
    return {
      outputText: JSON.stringify(convertJsonNumbersToStrings(parsed), null, 2)
    };
  }

  if (toolKey === 'dev_json_to_csv') {
    return {
      outputText: convertJsonToCsv(sourceText)
    };
  }

  if (toolKey === 'dev_json_to_php') {
    const parsed = parseJsonValue(sourceText);
    const phpArrayStyle = String(input?.phpArrayStyle || 'short');
    return {
      outputText: convertJsonToPhp(parsed, phpArrayStyle === 'long' ? 'long' : 'short')
    };
  }

  if (toolKey === 'dev_js_object_to_json') {
    return {
      outputText: JSON.stringify(parseJsObjectLiteral(sourceText), null, 2)
    };
  }

  if (toolKey === 'dev_json_to_js_object') {
    const parsed = parseJsonValue(sourceText);
    const exportName = normalizeJsIdentifier(String(input?.jsExportName || '').trim() || 'dataObject');
    return {
      outputText: `const ${exportName} = ${serializeJsValue(parsed)};`
    };
  }

  if (toolKey === 'dev_json_merge') {
    return {
      outputText: JSON.stringify(
        mergeJsonDocuments(sourceText, String(input?.jsonMergeMode || 'object_merge')),
        null,
        2
      )
    };
  }

  if (toolKey === 'dev_json_key_value_extract') {
    const parsed = parseJsonValue(sourceText);
    const keyValueSeparator = String(input?.keyValueSeparator || '=');
    return {
      outputText: flattenJsonKeyValues(parsed, keyValueSeparator).join('\n')
    };
  }

  if (toolKey === 'dev_excel_to_json') {
    return {
      outputText: JSON.stringify(convertTableTextToJsonRows(sourceText), null, 2)
    };
  }

  if (toolKey === 'dev_excel_to_array') {
    return {
      outputText: JSON.stringify(parseTableText(sourceText))
    };
  }

  if (toolKey === 'dev_excel_to_html') {
    return {
      outputText: convertTableTextToHtml(sourceText)
    };
  }

  if (toolKey === 'dev_json_to_array') {
    const parsed = parseJsonValue(sourceText);
    return {
      outputText: serializeJsValue(parsed)
    };
  }

  if (toolKey === 'dev_json_array_to_excel') {
    return {
      outputText: convertJsonArrayToTableText(sourceText)
    };
  }

  if (toolKey === 'dev_json_object_to_excel' || toolKey === 'dev_kv_json_to_excel') {
    return {
      outputText: convertJsonObjectToKeyValueTableText(sourceText)
    };
  }

  if (toolKey === 'dev_excel_to_kv_json') {
    return {
      outputText: JSON.stringify(convertTableTextToKeyValueJson(sourceText), null, 2)
    };
  }

  if (toolKey === 'dev_json_flatten') {
    return {
      outputText: JSON.stringify(flattenJsonObject(parseJsonValue(sourceText)), null, 2)
    };
  }

  if (toolKey === 'dev_json_expand') {
    return {
      outputText: JSON.stringify(expandFlattenedJson(parseJsonValue(sourceText)), null, 2)
    };
  }

  if (toolKey === 'dev_json_missing_find') {
    return {
      outputText: findMissingJsonPaths(sourceText, String(input?.compareJsonText || '')).join('\n')
    };
  }

  if (toolKey === 'dev_json_clear_values') {
    return {
      outputText: JSON.stringify(clearJsonValues(parseJsonValue(sourceText), String(input?.jsonClearMode || 'empty_string')), null, 2)
    };
  }

  if (toolKey === 'dev_json_slice') {
    return {
      outputText: sliceJsonArrayText(sourceText, String(input?.jsonSliceSize || '2'))
    };
  }

  if (toolKey === 'dev_add_http_protocol') {
    return {
      outputText: splitNonEmptyLines(sourceText)
        .map((line) => /^https?:\/\//i.test(line) ? line : `http://${line}`)
        .join('\n')
    };
  }

  if (toolKey === 'dev_url_params_remove') {
    return {
      outputText: splitNonEmptyLines(sourceText)
        .map(removeUrlSearchParams)
        .join('\n')
    };
  }

  if (toolKey === 'dev_url_params_set') {
    return {
      outputText: splitNonEmptyLines(sourceText)
        .map((line) => applyUrlParams(line, String(input?.urlSetParamsText || '')))
        .join('\n')
    };
  }

  if (toolKey === 'dev_web_meta_generate') {
    return {
      outputText: buildMetaTagsMarkup(input)
    };
  }

  if (toolKey === 'dev_ipv6_check') {
    return {
      outputText: await detectIpv6SupportText()
    };
  }

  if (toolKey === 'dev_ddl_to_php_array') {
    return {
      outputText: convertDdlToPhpArray(sourceText)
    };
  }

  if (toolKey === 'dev_field_list_to_php_array') {
    return {
      outputText: convertFieldListToPhpArray(sourceText)
    };
  }

  if (toolKey === 'dev_text_list_to_js_object') {
    return {
      outputText: convertTextListToJsObject(sourceText, String(input?.jsObjectMode || 'same_value'))
    };
  }

  if (toolKey === 'dev_css_to_js') {
    return {
      outputText: convertCssToJsSnippet(sourceText)
    };
  }

  if (toolKey === 'dev_html_to_json') {
    return {
      outputText: JSON.stringify(convertHtmlToJsonTree(sourceText), null, 2)
    };
  }

  if (toolKey === 'dev_js_data_import') {
    return {
      outputText: convertJsDataImport(sourceText, String(input?.jsImportName || '').trim() || 'dataSource')
    };
  }

  if (toolKey === 'dev_html_inline_style_remove') {
    return {
      outputText: removeInlineStyles(sourceText, String(input?.inlineStyleNames || ''))
    };
  }

  if (toolKey === 'dev_cookie_import_code') {
    return {
      outputText: convertCookieToImportCode(sourceText, String(input?.cookieDomain || '').trim(), String(input?.cookiePath || '/').trim() || '/')
    };
  }

  if (toolKey === 'dev_frontend_i18n_convert') {
    return {
      outputText: convertI18nTableText(sourceText)
    };
  }

  if (toolKey === 'dev_rsa_keypair_generate') {
    const keySize = toPositiveInteger(input?.rsaKeySize, 2048, 2048, 4096);
    return generateRsaKeyPairOutput(keySize);
  }

  if (toolKey === 'dev_browser_fingerprint_check') {
    return {
      outputText: buildBrowserFingerprintText(input)
    };
  }

  if (toolKey === 'dev_multi_source_ip_check') {
    return {
      outputText: await queryMultiSourceIpText()
    };
  }

  if (toolKey === 'dev_uuid_generate') {
    const uuidCount = toPositiveInteger(input?.uuidCount, 10, 1, 100);
    return {
      outputText: Array.from({ length: uuidCount }, () => crypto.randomUUID()).join('\n')
    };
  }

  throw new Error(`Unsupported dev tool: ${toolKey}`);
}

function encodeBase64Text(text) {
  const bytes = new TextEncoder().encode(text);
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
}

function decodeBase64Text(text) {
  const binary = atob(text);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function toFullWidthChar(char) {
  if (char === ' ') {
    return '\u3000';
  }

  const code = char.charCodeAt(0);
  if (code >= 33 && code <= 126) {
    return String.fromCharCode(code + 65248);
  }

  return char;
}

function toHalfWidthChar(char) {
  if (char === '\u3000') {
    return ' ';
  }

  const code = char.charCodeAt(0);
  if (code >= 65281 && code <= 65374) {
    return String.fromCharCode(code - 65248);
  }

  return char;
}

function toPositiveInteger(value, fallbackValue, minValue, maxValue) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }

  return Math.min(Math.max(parsed, minValue), maxValue);
}

function encodeHtmlEntities(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function decodeHtmlEntities(text) {
  return String(text)
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
}

function parseHttpHeaders(text) {
  const result = {};
  for (const line of splitNonEmptyLines(text)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      result[key] = value;
    }
  }

  return result;
}

function parseCookieText(text) {
  const result = {};
  for (const part of String(text).split(';')) {
    const trimmedPart = part.trim();
    if (!trimmedPart) {
      continue;
    }

    const separatorIndex = trimmedPart.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedPart.slice(0, separatorIndex).trim();
    const value = trimmedPart.slice(separatorIndex + 1).trim();
    if (key) {
      result[key] = value;
    }
  }

  return result;
}

function splitNonEmptyLines(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseJsonArray(text) {
  const parsed = parseJsonValue(text);
  if (!Array.isArray(parsed)) {
    throw new Error('请输入 JSON 数组。');
  }

  return parsed;
}

function parseJsonValue(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('JSON 格式不正确，请检查后重试。');
  }
}

function readJsonPath(value, path) {
  return String(path)
    .split('.')
    .filter(Boolean)
    .reduce((currentValue, segment) => {
      if (currentValue === null || typeof currentValue === 'undefined') {
        return undefined;
      }

      if (Array.isArray(currentValue) && /^\d+$/.test(segment)) {
        return currentValue[Number.parseInt(segment, 10)];
      }

      return currentValue[segment];
    }, value);
}

function convertTimestampToReadableText(text) {
  const trimmed = String(text).trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error('请输入秒级或毫秒级时间戳。');
  }

  const numericValue = Number.parseInt(trimmed, 10);
  const milliseconds = trimmed.length <= 10 ? numericValue * 1000 : numericValue;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    throw new Error('时间戳格式不正确，请检查后重试。');
  }

  return [
    `秒级时间戳：${Math.floor(milliseconds / 1000)}`,
    `毫秒级时间戳：${milliseconds}`,
    `UTC：${date.toISOString()}`
  ].join('\n');
}

function convertDateTextToTimestamps(text) {
  const normalizedText = String(text).trim();
  const date = new Date(normalizedText);
  if (Number.isNaN(date.getTime())) {
    throw new Error('日期格式不正确，请输入可识别的日期时间。');
  }

  const milliseconds = date.getTime();
  return [
    `秒级时间戳：${Math.floor(milliseconds / 1000)}`,
    `毫秒级时间戳：${milliseconds}`,
    `UTC：${date.toISOString()}`
  ].join('\n');
}

function toBaseValue(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 2 || parsed > 36) {
    return fallbackValue;
  }

  return parsed;
}

function convertRadixText(text, fromBase, toBase) {
  const trimmed = String(text).trim();
  if (!trimmed) {
    return '';
  }

  const negative = trimmed.startsWith('-');
  const numberText = negative ? trimmed.slice(1) : trimmed;
  const parsedValue = parseInt(numberText, fromBase);
  if (Number.isNaN(parsedValue)) {
    throw new Error('请输入合法的进制数字。');
  }

  const converted = parsedValue.toString(toBase);
  return negative ? `-${converted}` : converted;
}

function splitBaseTokens(text) {
  return String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

async function digestHex(text, hashAlgorithm) {
  const subtleAlgorithmByKey = {
    sha1: 'SHA-1',
    sha256: 'SHA-256',
    sha384: 'SHA-384',
    sha512: 'SHA-512'
  };
  const subtleAlgorithm = subtleAlgorithmByKey[hashAlgorithm];
  if (!subtleAlgorithm) {
    throw new Error('暂不支持这个哈希算法。');
  }

  const bytes = new TextEncoder().encode(text);
  const digestBuffer = await crypto.subtle.digest(subtleAlgorithm, bytes);
  return Array.from(new Uint8Array(digestBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function escapeXml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function md5Hex(text) {
  const words = stringToLittleEndianWords(text);
  const bitLength = utf8Bytes(text).length * 8;
  words[bitLength >> 5] |= 0x80 << (bitLength % 32);
  words[(((bitLength + 64) >>> 9) << 4) + 14] = bitLength;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let index = 0; index < words.length; index += 16) {
    const oldA = a;
    const oldB = b;
    const oldC = c;
    const oldD = d;

    a = md5ff(a, b, c, d, words[index], 7, -680876936);
    d = md5ff(d, a, b, c, words[index + 1], 12, -389564586);
    c = md5ff(c, d, a, b, words[index + 2], 17, 606105819);
    b = md5ff(b, c, d, a, words[index + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, words[index + 4], 7, -176418897);
    d = md5ff(d, a, b, c, words[index + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, words[index + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, words[index + 7], 22, -45705983);
    a = md5ff(a, b, c, d, words[index + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, words[index + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, words[index + 10], 17, -42063);
    b = md5ff(b, c, d, a, words[index + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, words[index + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, words[index + 13], 12, -40341101);
    c = md5ff(c, d, a, b, words[index + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, words[index + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, words[index + 1], 5, -165796510);
    d = md5gg(d, a, b, c, words[index + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, words[index + 11], 14, 643717713);
    b = md5gg(b, c, d, a, words[index], 20, -373897302);
    a = md5gg(a, b, c, d, words[index + 5], 5, -701558691);
    d = md5gg(d, a, b, c, words[index + 10], 9, 38016083);
    c = md5gg(c, d, a, b, words[index + 15], 14, -660478335);
    b = md5gg(b, c, d, a, words[index + 4], 20, -405537848);
    a = md5gg(a, b, c, d, words[index + 9], 5, 568446438);
    d = md5gg(d, a, b, c, words[index + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, words[index + 3], 14, -187363961);
    b = md5gg(b, c, d, a, words[index + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, words[index + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, words[index + 2], 9, -51403784);
    c = md5gg(c, d, a, b, words[index + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, words[index + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, words[index + 5], 4, -378558);
    d = md5hh(d, a, b, c, words[index + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, words[index + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, words[index + 14], 23, -35309556);
    a = md5hh(a, b, c, d, words[index + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, words[index + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, words[index + 7], 16, -155497632);
    b = md5hh(b, c, d, a, words[index + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, words[index + 13], 4, 681279174);
    d = md5hh(d, a, b, c, words[index], 11, -358537222);
    c = md5hh(c, d, a, b, words[index + 3], 16, -722521979);
    b = md5hh(b, c, d, a, words[index + 6], 23, 76029189);
    a = md5hh(a, b, c, d, words[index + 9], 4, -640364487);
    d = md5hh(d, a, b, c, words[index + 12], 11, -421815835);
    c = md5hh(c, d, a, b, words[index + 15], 16, 530742520);
    b = md5hh(b, c, d, a, words[index + 2], 23, -995338651);

    a = md5ii(a, b, c, d, words[index], 6, -198630844);
    d = md5ii(d, a, b, c, words[index + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, words[index + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, words[index + 5], 21, -57434055);
    a = md5ii(a, b, c, d, words[index + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, words[index + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, words[index + 10], 15, -1051523);
    b = md5ii(b, c, d, a, words[index + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, words[index + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, words[index + 15], 10, -30611744);
    c = md5ii(c, d, a, b, words[index + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, words[index + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, words[index + 4], 6, -145523070);
    d = md5ii(d, a, b, c, words[index + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, words[index + 2], 15, 718787259);
    b = md5ii(b, c, d, a, words[index + 9], 21, -343485551);

    a = safeAdd(a, oldA);
    b = safeAdd(b, oldB);
    c = safeAdd(c, oldC);
    d = safeAdd(d, oldD);
  }

  return [a, b, c, d].map(wordToHex).join('');
}

function stringToLittleEndianWords(text) {
  const bytes = utf8Bytes(text);
  const words = [];
  for (let index = 0; index < bytes.length * 8; index += 8) {
    words[index >> 5] |= bytes[index / 8] << (index % 32);
  }
  return words;
}

function utf8Bytes(text) {
  return Array.from(new TextEncoder().encode(text));
}

function wordToHex(value) {
  let output = '';
  for (let index = 0; index < 4; index += 1) {
    output += ((value >> (index * 8)) & 0xff).toString(16).padStart(2, '0');
  }
  return output;
}

function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | (~d)), a, b, x, s, t);
}

function safeAdd(x, y) {
  const least = (x & 0xffff) + (y & 0xffff);
  const most = (x >> 16) + (y >> 16) + (least >> 16);
  return (most << 16) | (least & 0xffff);
}

function bitRotateLeft(value, count) {
  return (value << count) | (value >>> (32 - count));
}

function stripHtmlToPlainText(htmlText) {
  return decodeHtmlEntities(
    String(htmlText || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function encodeSvgDataUri(svgText) {
  return encodeURIComponent(String(svgText || ''))
    .replace(/%20/g, ' ')
    .replace(/%3D/g, '=')
    .replace(/%3A/g, ':')
    .replace(/%2F/g, '/');
}

function convertJsonStringNumbers(value) {
  if (Array.isArray(value)) {
    return value.map(convertJsonStringNumbers);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [key, convertJsonStringNumbers(childValue)])
    );
  }

  if (typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value.trim())) {
    return Number.parseFloat(value);
  }

  return value;
}

function convertJsonNumbersToStrings(value) {
  if (Array.isArray(value)) {
    return value.map(convertJsonNumbersToStrings);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [key, convertJsonNumbersToStrings(childValue)])
    );
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return value;
}

function convertJsonToCsv(text) {
  const parsed = parseJsonValue(text);
  if (!Array.isArray(parsed)) {
    throw new Error('请输入 JSON 数组。');
  }

  const keys = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('JSON 转 CSV 仅支持对象数组。');
    }
    for (const key of Object.keys(item)) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
  }

  const rows = [
    keys.join(','),
    ...parsed.map((item) => keys.map((key) => escapeCsvCell(item[key])).join(','))
  ];
  return rows.join('\n');
}

function escapeCsvCell(value) {
  if (value === null || typeof value === 'undefined') {
    return '';
  }

  const stringValue = typeof value === 'string'
    ? value
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function convertJsonToPhp(value, arrayStyle) {
  if (Array.isArray(value)) {
    const items = value.map((item) => convertJsonToPhp(item, arrayStyle));
    return arrayStyle === 'long'
      ? `array(${items.join(', ')})`
      : `[${items.join(', ')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, childValue]) =>
      `${serializePhpString(key)} => ${convertJsonToPhp(childValue, arrayStyle)}`
    );
    return arrayStyle === 'long'
      ? `array(${entries.join(', ')})`
      : `[${entries.join(', ')}]`;
  }

  if (typeof value === 'string') {
    return serializePhpString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === null) {
    return 'null';
  }

  return serializePhpString(String(value));
}

function serializePhpString(value) {
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function parseJsObjectLiteral(sourceText) {
  try {
    return Function(`"use strict"; return (${sourceText});`)();
  } catch {
    throw new Error('JS 对象格式不正确，请检查后重试。');
  }
}

function normalizeJsIdentifier(value) {
  const trimmed = value.trim();
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed)) {
    return trimmed;
  }

  return 'dataObject';
}

function serializeJsValue(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeJsValue(item)).join(', ')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, childValue]) => {
      const serializedKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
        ? key
        : JSON.stringify(key);
      return `${serializedKey}: ${serializeJsValue(childValue)}`;
    });
    return `{ ${entries.join(', ')} }`;
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === null) {
    return 'null';
  }

  return JSON.stringify(String(value));
}

function mergeJsonDocuments(text, mergeMode) {
  const chunks = String(text)
    .split(/\r?\n\s*\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (chunks.length < 2) {
    throw new Error('请至少输入两个 JSON，并用空行分隔。');
  }

  const documents = chunks.map((item) => parseJsonValue(item));

  if (mergeMode === 'array_concat') {
    return documents.flatMap((item) => Array.isArray(item) ? item : [item]);
  }

  return documents.reduce((merged, currentValue) => deepMergeJsonValues(merged, currentValue));
}

function deepMergeJsonValues(leftValue, rightValue) {
  if (Array.isArray(leftValue) && Array.isArray(rightValue)) {
    return [...leftValue, ...rightValue];
  }

  if (isPlainObject(leftValue) && isPlainObject(rightValue)) {
    const output = { ...leftValue };
    for (const [key, value] of Object.entries(rightValue)) {
      output[key] = key in output
        ? deepMergeJsonValues(output[key], value)
        : value;
    }
    return output;
  }

  return rightValue;
}

function flattenJsonKeyValues(value, separator) {
  const rows = [];
  visitJsonValue(value, '', rows, separator);
  return rows;
}

function visitJsonValue(value, path, rows, separator) {
  if (Array.isArray(value)) {
    value.forEach((childValue, index) => {
      visitJsonValue(childValue, path ? `${path}.${index}` : String(index), rows, separator);
    });
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, childValue] of Object.entries(value)) {
      visitJsonValue(childValue, path ? `${path}.${key}` : key, rows, separator);
    }
    return;
  }

  rows.push(`${path}${separator}${value === null ? 'null' : String(value)}`);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseTableText(text) {
  const rows = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ''))
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'));

  if (rows.length === 0) {
    throw new Error('请先粘贴表格内容。');
  }

  return rows;
}

function convertTableTextToJsonRows(text) {
  const rows = parseTableText(text);
  const headers = rows[0];
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header || `field_${index + 1}`, cells[index] || '']))
  );
}

function convertTableTextToHtml(text) {
  const rows = parseTableText(text);
  const [headerRow, ...bodyRows] = rows;
  const thead = `<thead><tr>${headerRow.map((cell) => `<th>${encodeHtmlEntities(cell)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${encodeHtmlEntities(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<table>\n${thead}\n${tbody}\n</table>`;
}

function convertJsonArrayToTableText(text) {
  const parsed = parseJsonArray(text);
  const keys = [];
  for (const item of parsed) {
    if (!isPlainObject(item)) {
      throw new Error('JSON数组转Excel仅支持对象数组。');
    }
    for (const key of Object.keys(item)) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
  }

  return [
    keys.join('\t'),
    ...parsed.map((item) => keys.map((key) => stringifyCellValue(item[key])).join('\t'))
  ].join('\n');
}

function convertJsonObjectToKeyValueTableText(text) {
  const parsed = parseJsonValue(text);
  if (!isPlainObject(parsed)) {
    throw new Error('请输入 JSON 对象。');
  }

  return [
    'key\tvalue',
    ...Object.entries(parsed).map(([key, value]) => `${key}\t${stringifyCellValue(value)}`)
  ].join('\n');
}

function convertTableTextToKeyValueJson(text) {
  const rows = parseTableText(text);
  const contentRows = rows[0][0] === 'key' ? rows.slice(1) : rows;
  const output = {};
  for (const row of contentRows) {
    const key = String(row[0] || '').trim();
    if (!key) {
      continue;
    }
    output[key] = row[1] || '';
  }
  return output;
}

function flattenJsonObject(value) {
  const flattened = {};
  visitFlattenJson(value, '', flattened);
  return flattened;
}

function visitFlattenJson(value, path, output) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      visitFlattenJson(item, path ? `${path}.${index}` : String(index), output);
    });
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, childValue] of Object.entries(value)) {
      visitFlattenJson(childValue, path ? `${path}.${key}` : key, output);
    }
    return;
  }

  output[path] = value;
}

function expandFlattenedJson(value) {
  if (!isPlainObject(value)) {
    throw new Error('请输入一级 JSON 对象。');
  }

  const output = {};
  for (const [flatKey, flatValue] of Object.entries(value)) {
    assignExpandedJsonValue(output, flatKey, flatValue);
  }

  return output;
}

function assignExpandedJsonValue(output, flatKey, flatValue) {
  const segments = String(flatKey).split('.').filter(Boolean);
  let current = output;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const isLast = index === segments.length - 1;
    const nextSegment = segments[index + 1];
    const nextShouldBeArray = /^\d+$/.test(String(nextSegment || ''));

    if (isLast) {
      if (/^\d+$/.test(segment)) {
        if (!Array.isArray(current)) {
          return;
        }
        current[Number.parseInt(segment, 10)] = flatValue;
      } else {
        current[segment] = flatValue;
      }
      return;
    }

    if (/^\d+$/.test(segment)) {
      const numericIndex = Number.parseInt(segment, 10);
      if (!Array.isArray(current)) {
        return;
      }
      if (typeof current[numericIndex] === 'undefined') {
        current[numericIndex] = nextShouldBeArray ? [] : {};
      }
      current = current[numericIndex];
      continue;
    }

    if (typeof current[segment] === 'undefined') {
      current[segment] = nextShouldBeArray ? [] : {};
    }
    current = current[segment];
  }
}

function findMissingJsonPaths(sourceText, compareJsonText) {
  const sourceFlattened = flattenJsonObject(parseJsonValue(sourceText));
  const compareFlattened = flattenJsonObject(parseJsonValue(compareJsonText));
  return Object.keys(sourceFlattened).filter((key) => !Object.prototype.hasOwnProperty.call(compareFlattened, key));
}

function clearJsonValues(value, mode) {
  if (Array.isArray(value)) {
    return value.map((item) => clearJsonValues(item, mode));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [key, clearJsonValues(childValue, mode)])
    );
  }

  return mode === 'null' ? null : '';
}

function sliceJsonArrayText(text, sliceSizeText) {
  const parsed = parseJsonArray(text);
  const sliceSize = toPositiveInteger(sliceSizeText, 2, 1, 1000);
  const chunks = [];
  for (let index = 0; index < parsed.length; index += sliceSize) {
    chunks.push(JSON.stringify(parsed.slice(index, index + sliceSize), null, 2));
  }
  return chunks.join('\n\n');
}

function stringifyCellValue(value) {
  if (value === null || typeof value === 'undefined') {
    return '';
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function removeUrlSearchParams(value) {
  const normalizedUrl = normalizeUrlForTool(value);
  if (!normalizedUrl) {
    return value;
  }

  normalizedUrl.search = '';
  return normalizedUrl.toString();
}

function applyUrlParams(value, paramsText) {
  const normalizedUrl = normalizeUrlForTool(value);
  if (!normalizedUrl) {
    return value;
  }

  const nextParams = parseKeyValueLinePairs(paramsText);
  for (const [key, val] of nextParams) {
    normalizedUrl.searchParams.set(key, val);
  }

  return normalizedUrl.toString();
}

function normalizeUrlForTool(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return null;
  }

  try {
    return new URL(rawValue);
  } catch {
    try {
      return new URL(/^https?:\/\//i.test(rawValue) ? rawValue : `http://${rawValue}`);
    } catch {
      return null;
    }
  }
}

function parseKeyValueLinePairs(text) {
  return splitNonEmptyLines(text)
    .map((line) => {
      const separatorIndex = line.indexOf('=');
      return separatorIndex === -1
        ? null
        : [line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()];
    })
    .filter((item) => item && item[0]);
}

function buildMetaTagsMarkup(input) {
  const title = String(input?.metaTitle || '').trim();
  const description = String(input?.metaDescription || '').trim();
  const keywords = String(input?.metaKeywords || '').trim();
  const canonical = String(input?.metaCanonical || '').trim();
  const robots = String(input?.metaRobots || '').trim();

  const lines = [];
  if (title) {
    lines.push(`<title>${encodeHtmlEntities(title)}</title>`);
  }
  if (description) {
    lines.push(`<meta name="description" content="${encodeHtmlEntities(description)}">`);
  }
  if (keywords) {
    lines.push(`<meta name="keywords" content="${encodeHtmlEntities(keywords)}">`);
  }
  if (robots) {
    lines.push(`<meta name="robots" content="${encodeHtmlEntities(robots)}">`);
  }
  if (canonical) {
    lines.push(`<link rel="canonical" href="${encodeHtmlEntities(canonical)}">`);
  }

  return lines.join('\n');
}

async function detectIpv6SupportText() {
  try {
    const response = await fetch('https://ipv6.icanhazip.com');
    if (!response.ok) {
      throw new Error('fetch failed');
    }

    const ipv6Address = String(await response.text()).trim();
    return `IPv6 支持：是\nIPv6 地址：${ipv6Address || '-'}`;
  } catch {
    return 'IPv6 支持：否\nIPv6 地址：-';
  }
}

function convertDdlToPhpArray(text) {
  const entries = [];
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.trim().replace(/,$/, '');
    if (!line || /^(CREATE|PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|\))/i.test(line)) {
      continue;
    }
    const match = line.match(/^`?([A-Za-z0-9_]+)`?\s+([A-Za-z0-9()]+)/i);
    if (!match) {
      continue;
    }
    const [, fieldName, fieldType] = match;
    const fieldLabel = line.match(/COMMENT\s+'([^']*)'/i)?.[1] || '';
    entries.push(`  '${fieldName}' => ['type' => '${fieldType}', 'label' => '${fieldLabel}']`);
  }
  if (entries.length === 0) {
    throw new Error('未识别到字段定义，请粘贴标准建表语句。');
  }
  return `[\n${entries.join(',\n')}\n]`;
}

function convertFieldListToPhpArray(text) {
  const fields = splitNonEmptyLines(text);
  return `[${fields.map((field) => `'${field.replaceAll("'", "\\'")}'`).join(', ')}]`;
}

function convertTextListToJsObject(text, mode) {
  const lines = splitNonEmptyLines(text);
  const entries = lines.map((line, index) =>
    mode === 'index_value'
      ? `${index}: ${JSON.stringify(line)}`
      : `${normalizeJsIdentifier(line)}: ${JSON.stringify(line)}`
  );
  return `{ ${entries.join(', ')} }`;
}

function convertCssToJsSnippet(text) {
  const cssText = JSON.stringify(String(text || '').trim());
  return [
    "const style = document.createElement('style');",
    `style.textContent = ${cssText};`,
    'document.head.appendChild(style);'
  ].join('\n');
}

function convertHtmlToJsonTree(text) {
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(text || ''), 'text/html');
    const root = doc.body.firstElementChild || doc.body;
    return walkHtmlNode(root);
  }
  return parseHtmlTreeWithoutDom(String(text || ''));
}

function walkHtmlNode(node) {
  const attrs = {};
  if (node.attributes) {
    for (const attr of node.attributes) {
      attrs[attr.name] = attr.value;
    }
  }
  return {
    tag: node.tagName ? node.tagName.toLowerCase() : '#text',
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    ...(node.childNodes && node.childNodes.length > 0 ? {
      children: Array.from(node.childNodes)
        .map((child) => child.nodeType === 3
          ? (child.textContent.trim() ? { text: child.textContent.trim() } : null)
          : walkHtmlNode(child))
        .filter(Boolean)
    } : {})
  };
}

function convertJsDataImport(text, variableName) {
  const lines = splitNonEmptyLines(text);
  const normalizedName = normalizeJsIdentifier(variableName);
  if (lines.length > 1) {
    return `const ${normalizedName} = [${lines.map((line) => JSON.stringify(line)).join(', ')}];`;
  }
  return `const ${normalizedName} = ${JSON.stringify(String(text || ''))};`;
}

function removeInlineStyles(text, styleNamesText) {
  let htmlText = String(text || '');
  const styleNames = splitNonEmptyLines(String(styleNamesText || '').replaceAll(',', '\n')).map((item) => item.trim().toLowerCase());
  if (styleNames.length === 0) {
    return htmlText.replace(/\sstyle=(['"]).*?\1/gi, '');
  }

  return htmlText.replace(/\sstyle=(['"])(.*?)\1/gi, (_match, quote, styleValue) => {
    const nextRules = styleValue
      .split(';')
      .map((rule) => rule.trim())
      .filter(Boolean)
      .filter((rule) => !styleNames.includes(rule.split(':')[0].trim().toLowerCase()));
    return nextRules.length > 0 ? ` style=${quote}${nextRules.join('; ')}${quote}` : '';
  });
}

function convertCookieToImportCode(text, cookieDomain, cookiePath) {
  const cookies = parseCookieText(text);
  return Object.entries(cookies)
    .map(([key, value]) => `document.cookie = "${key}=${value}; domain=${cookieDomain}; path=${cookiePath}";`)
    .join('\n');
}

function convertI18nTableText(text) {
  const rows = parseTableText(text);
  const [headerRow, ...bodyRows] = rows;
  if (headerRow.length < 2) {
    throw new Error('请至少提供 key 和一个语言列。');
  }

  const localeMaps = {};
  for (let index = 1; index < headerRow.length; index += 1) {
    localeMaps[headerRow[index]] = {};
  }

  for (const row of bodyRows) {
    const key = String(row[0] || '').trim();
    if (!key) {
      continue;
    }
    for (let index = 1; index < headerRow.length; index += 1) {
      localeMaps[headerRow[index]][key] = row[index] || '';
    }
  }

  return Object.entries(localeMaps)
    .map(([locale, map]) => `${locale}:\n${JSON.stringify(map, null, 2)}`)
    .join('\n\n');
}

function parseHtmlTreeWithoutDom(text) {
  const compact = String(text || '').trim();
  const elementMatch = compact.match(/^<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*)<\/\1>$/);
  if (!elementMatch) {
    return { text: compact };
  }

  const [, tagName, attrText, innerHtml] = elementMatch;
  const attrs = {};
  for (const attrMatch of attrText.matchAll(/([a-zA-Z0-9:-]+)="([^"]*)"/g)) {
    attrs[attrMatch[1]] = attrMatch[2];
  }

  const children = [];
  const innerTrimmed = innerHtml.trim();
  if (innerTrimmed) {
    const childElementMatch = innerTrimmed.match(/^<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*)<\/\1>$/);
    if (childElementMatch) {
      children.push(parseHtmlTreeWithoutDom(innerTrimmed));
    } else {
      children.push({ text: innerTrimmed });
    }
  }

  return {
    tag: tagName.toLowerCase(),
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    ...(children.length > 0 ? { children } : {})
  };
}

async function generateRsaKeyPairOutput(keySize) {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: keySize,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    outputText: [
      toPemBlock('PUBLIC KEY', publicKeyBuffer),
      '',
      toPemBlock('PRIVATE KEY', privateKeyBuffer)
    ].join('\n')
  };
}

function toPemBlock(label, buffer) {
  const base64 = encodeBase64Bytes(new Uint8Array(buffer));
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

function encodeBase64Bytes(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function buildBrowserFingerprintText(input) {
  const screenInfo = input?.screenInfo || {};
  const viewportInfo = input?.viewportInfo || {};
  const languages = Array.isArray(input?.browserLanguages) ? input.browserLanguages : [];
  const memoryValue = Number(input?.browserDeviceMemory || 0);

  return [
    `User-Agent：${String(input?.browserUserAgent || '')}`,
    `平台：${String(input?.browserPlatform || '')}`,
    `默认语言：${String(input?.browserLanguage || '')}`,
    `语言列表：${languages.join(', ') || '-'}`,
    `时区：${String(input?.browserTimezone || '') || '-'}`,
    `Cookie 启用：${input?.browserCookieEnabled ? '是' : '否'}`,
    `Do Not Track：${String(input?.browserDoNotTrack || '-')}`,
    `逻辑核心数：${Number(input?.browserHardwareConcurrency || 0) || 0}`,
    `设备内存：${memoryValue > 0 ? `${memoryValue} GB` : '-'}`,
    `最大触点数：${Number(input?.browserMaxTouchPoints || 0) || 0}`,
    `在线状态：${input?.browserOnline ? '在线' : '离线'}`,
    `屏幕分辨率：${screenInfo.width || 0} x ${screenInfo.height || 0}`,
    `可用区域：${screenInfo.availWidth || 0} x ${screenInfo.availHeight || 0}`,
    `设备像素比：${screenInfo.devicePixelRatio || 1}`,
    `色深：${screenInfo.colorDepth || 0}`,
    `视口：${viewportInfo.width || 0} x ${viewportInfo.height || 0}`
  ].join('\n');
}

async function queryMultiSourceIpText() {
  const sources = [
    { key: 'ipify', url: 'https://api.ipify.org?format=json', read: (body) => body.ip || '' },
    { key: 'myip', url: 'https://api.myip.com', read: (body) => body.ip || '' },
    { key: 'httpbin', url: 'https://httpbin.org/ip', read: (body) => body.origin || '' }
  ];

  const outputs = [];
  for (const source of sources) {
    try {
      const response = await fetch(source.url);
      if (!response.ok) {
        outputs.push(`${source.key}：检测失败`);
        continue;
      }

      const body = await response.json();
      const ipText = String(source.read(body) || '').trim();
      outputs.push(`${source.key}：${ipText || '检测失败'}`);
    } catch {
      outputs.push(`${source.key}：检测失败`);
    }
  }

  return outputs.join('\n');
}

function formatCronSchedule(expression, cronStartTime) {
  const cronExpression = String(expression || '').trim();
  const segments = cronExpression.split(/\s+/).filter(Boolean);
  if (segments.length !== 5) {
    throw new Error('请填写标准 5 段 Crontab 表达式。');
  }

  const minuteMatcher = parseCronSegment(segments[0], 0, 59);
  const hourMatcher = parseCronSegment(segments[1], 0, 23);
  const dayMatcher = parseCronSegment(segments[2], 1, 31);
  const monthMatcher = parseCronSegment(segments[3], 1, 12);
  const weekMatcher = parseCronSegment(segments[4], 0, 6);

  const startDate = cronStartTime ? new Date(cronStartTime) : new Date();
  if (Number.isNaN(startDate.getTime())) {
    throw new Error('起始时间格式不正确，请输入可识别的日期时间。');
  }

  const nextRuns = [];
  const cursor = new Date(startDate.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  while (nextRuns.length < 5) {
    if (
      minuteMatcher.has(cursor.getUTCMinutes()) &&
      hourMatcher.has(cursor.getUTCHours()) &&
      dayMatcher.has(cursor.getUTCDate()) &&
      monthMatcher.has(cursor.getUTCMonth() + 1) &&
      weekMatcher.has(cursor.getUTCDay())
    ) {
      nextRuns.push(cursor.toISOString());
    }

    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

    if (nextRuns.length === 0 && cursor.getTime() - startDate.getTime() > 366 * 24 * 60 * 60 * 1000) {
      throw new Error('表达式在一年内没有匹配结果，请检查写法。');
    }
  }

  return [
    `表达式：${cronExpression}`,
    `起始时间：${startDate.toISOString()}`,
    ...nextRuns.map((item, index) => `${index + 1}. ${item}`)
  ].join('\n');
}

function parseCronSegment(segment, minValue, maxValue) {
  const values = new Set();
  const normalized = String(segment || '').trim();
  if (!normalized) {
    throw new Error('Crontab 表达式不完整。');
  }

  for (const part of normalized.split(',')) {
    const trimmedPart = part.trim();
    if (!trimmedPart) {
      continue;
    }

    const [rangePart, stepPart] = trimmedPart.split('/');
    const stepValue = stepPart ? Number.parseInt(stepPart, 10) : 1;
    if (!Number.isFinite(stepValue) || stepValue <= 0) {
      throw new Error('Crontab 步长格式不正确。');
    }

    if (rangePart === '*') {
      for (let value = minValue; value <= maxValue; value += stepValue) {
        values.add(value);
      }
      continue;
    }

    if (rangePart.includes('-')) {
      const [startText, endText] = rangePart.split('-');
      const startValue = Number.parseInt(startText, 10);
      const endValue = Number.parseInt(endText, 10);
      if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || startValue > endValue) {
        throw new Error('Crontab 范围格式不正确。');
      }
      for (let value = startValue; value <= endValue; value += stepValue) {
        ensureCronValueInRange(value, minValue, maxValue);
        values.add(value);
      }
      continue;
    }

    const singleValue = Number.parseInt(rangePart, 10);
    if (!Number.isFinite(singleValue)) {
      throw new Error('Crontab 字段包含无法识别的值。');
    }
    ensureCronValueInRange(singleValue, minValue, maxValue);
    values.add(singleValue);
  }

  return values;
}

function ensureCronValueInRange(value, minValue, maxValue) {
  if (value < minValue || value > maxValue) {
    throw new Error('Crontab 字段超出合法范围。');
  }
}
