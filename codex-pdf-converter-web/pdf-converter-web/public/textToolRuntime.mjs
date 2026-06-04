export function runTextTool(toolKey, input) {
  const sourceText = String(input?.sourceText || '');

  if (toolKey === 'text_unique') {
    const seen = new Set();
    const outputLines = [];
    for (const line of splitLines(sourceText)) {
      if (seen.has(line)) {
        continue;
      }
      seen.add(line);
      outputLines.push(line);
    }

    return {
      outputText: outputLines.join('\n')
    };
  }

  if (toolKey === 'text_remove_blank_lines') {
    return {
      outputText: splitLines(sourceText)
        .filter((line) => line.trim() !== '')
        .join('\n')
    };
  }

  if (toolKey === 'text_remove_spaces') {
    return {
      outputText: sourceText.replace(/\s+/g, '')
    };
  }

  if (toolKey === 'text_replace_batch') {
    const findText = String(input?.findText || '');
    const replaceText = String(input?.replaceText || '');
    return {
      outputText: findText ? sourceText.split(findText).join(replaceText) : sourceText
    };
  }

  if (toolKey === 'text_char_count') {
    return {
      outputText: sourceText,
      summary: {
        totalChars: sourceText.length,
        nonWhitespaceChars: sourceText.replace(/\s/g, '').length,
        lineCount: countLines(sourceText)
      }
    };
  }

  if (toolKey === 'text_case_convert') {
    const caseMode = String(input?.caseMode || 'upper');
    return {
      outputText: convertEnglishCase(sourceText, caseMode)
    };
  }

  if (toolKey === 'text_extract_urls') {
    return {
      outputText: uniqueMatches(sourceText.match(/https?:\/\/[^\s"'<>]+/g)).join('\n')
    };
  }

  if (toolKey === 'text_extract_emails') {
    return {
      outputText: uniqueMatches(sourceText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)).join('\n')
    };
  }

  if (toolKey === 'text_extract_phones') {
    return {
      outputText: uniqueMatches(sourceText.match(/1[3-9]\d{9}/g)).join('\n')
    };
  }

  if (toolKey === 'text_extract_domains') {
    const rawMatches = uniqueMatches(
      sourceText.match(/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}/gi)
    );
    return {
      outputText: rawMatches.join('\n')
    };
  }

  if (toolKey === 'text_extract_ips') {
    return {
      outputText: uniqueMatches(
        sourceText.match(/\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/g)
      ).join('\n')
    };
  }

  if (toolKey === 'text_extract_numbers') {
    return {
      outputText: uniqueMatches(sourceText.match(/\d+/g)).join('\n')
    };
  }

  if (toolKey === 'text_to_list') {
    const separator = String(input?.separator || ',');
    return {
      outputText: sourceText
        .split(separator)
        .map((item) => item.trim())
        .filter(Boolean)
        .join('\n')
    };
  }

  if (toolKey === 'list_to_text') {
    const separator = String(input?.separator || ', ');
    return {
      outputText: splitLines(sourceText)
        .map((item) => item.trim())
        .filter(Boolean)
        .join(separator)
    };
  }

  if (toolKey === 'list_sort') {
    const sortMode = String(input?.sortMode || 'asc');
    const lines = splitLines(sourceText)
      .map((item) => item.trim())
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, 'zh-CN'));

    if (sortMode === 'desc') {
      lines.reverse();
    }

    return {
      outputText: lines.join('\n')
    };
  }

  if (toolKey === 'list_shuffle') {
    const lines = splitLines(sourceText)
      .map((item) => item.trim())
      .filter(Boolean);
    const shuffled = lines.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    return {
      outputText: shuffled.join('\n')
    };
  }

  if (toolKey === 'list_duplicate_count') {
    const counter = new Map();
    for (const line of splitLines(sourceText).map((item) => item.trim()).filter(Boolean)) {
      counter.set(line, (counter.get(line) || 0) + 1);
    }

    return {
      outputText: Array.from(counter.entries())
        .map(([line, count]) => `${line}\t${count}`)
        .join('\n')
    };
  }

  if (toolKey === 'list_add_prefix_suffix') {
    const prefixText = String(input?.prefixText || '');
    const suffixText = String(input?.suffixText || '');
    return {
      outputText: splitLines(sourceText)
        .map((line) => {
          if (!line.trim()) {
            return line;
          }
          return `${prefixText}${line}${suffixText}`;
        })
        .join('\n')
    };
  }

  if (toolKey === 'list_cut_left') {
    const cutLength = toPositiveInteger(input?.cutLength, 1);
    return {
      outputText: splitLines(sourceText)
        .map((line) => line.slice(0, cutLength))
        .join('\n')
    };
  }

  if (toolKey === 'list_cut_right') {
    const cutLength = toPositiveInteger(input?.cutLength, 1);
    return {
      outputText: splitLines(sourceText)
        .map((line) => line.slice(line.length - cutLength))
        .join('\n')
    };
  }

  if (toolKey === 'text_regex_extract') {
    const regexPattern = String(input?.regexPattern || '');
    if (!regexPattern) {
      return { outputText: '' };
    }

    const matcher = new RegExp(regexPattern, 'g');
    return {
      outputText: uniqueMatches(sourceText.match(matcher)).join('\n')
    };
  }

  if (toolKey === 'text_unicode_convert') {
    const unicodeMode = String(input?.unicodeMode || 'encode');
    return {
      outputText: unicodeMode === 'decode'
        ? decodeUnicodeText(sourceText)
        : encodeUnicodeText(sourceText)
    };
  }

  if (toolKey === 'text_money_upper') {
    return {
      outputText: convertMoneyToUpper(sourceText)
    };
  }

  if (toolKey === 'text_symbol_convert') {
    const symbolMode = String(input?.symbolMode || 'en_to_zh');
    return {
      outputText: convertSymbols(sourceText, symbolMode)
    };
  }

  if (toolKey === 'text_banned_words_check') {
    const bannedWords = splitLines(String(input?.bannedWords || ''))
      .map((item) => item.trim())
      .filter(Boolean);
    const matches = bannedWords.filter((word) => sourceText.includes(word));
    return {
      outputText: matches.join('\n'),
      summary: {
        matchCount: matches.length,
        lineCount: bannedWords.length,
        totalChars: sourceText.length,
        nonWhitespaceChars: sourceText.replace(/\s/g, '').length
      }
    };
  }

  if (toolKey === 'text_uuid_generate') {
    const uuidCount = toPositiveInteger(input?.uuidCount, 1);
    const uuids = Array.from({ length: Math.min(uuidCount, 100) }, () => crypto.randomUUID());
    return {
      outputText: uuids.join('\n')
    };
  }

  throw new Error(`Unsupported text tool: ${toolKey}`);
}

function splitLines(text) {
  return String(text).split(/\r?\n/);
}

function countLines(text) {
  if (!text) {
    return 0;
  }

  return splitLines(text).length;
}

function convertEnglishCase(text, caseMode) {
  if (caseMode === 'lower') {
    return text.toLowerCase();
  }

  if (caseMode === 'title') {
    return text.replace(/\b([a-z])/gi, (match) => match.toUpperCase());
  }

  return text.toUpperCase();
}

function uniqueMatches(matches) {
  return Array.from(new Set(matches || []));
}

function toPositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function encodeUnicodeText(text) {
  return Array.from(text)
    .map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
    .join('');
}

function decodeUnicodeText(text) {
  return String(text).replace(/\\u([0-9a-fA-F]{4})/g, (_match, code) =>
    String.fromCharCode(Number.parseInt(code, 16))
  );
}

function convertSymbols(text, symbolMode) {
  const mapEnToZh = {
    ',': '，',
    '.': '。',
    ':': '：',
    ';': '；',
    '!': '！',
    '?': '？',
    '(': '（',
    ')': '）'
  };
  const mapZhToEn = Object.fromEntries(Object.entries(mapEnToZh).map(([key, value]) => [value, key]));
  const map = symbolMode === 'zh_to_en' ? mapZhToEn : mapEnToZh;

  return Array.from(String(text))
    .map((char) => map[char] || char)
    .join('');
}

function convertMoneyToUpper(value) {
  const amount = Number.parseFloat(String(value || '').trim());
  if (!Number.isFinite(amount)) {
    return '';
  }

  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const groupUnits = ['', '万', '亿'];

  const fixed = amount.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');
  let integerText = '';
  const groups = integerPart.replace(/^0+/, '') || '0';
  const chunks = [];
  for (let index = groups.length; index > 0; index -= 4) {
    chunks.unshift(groups.slice(Math.max(0, index - 4), index));
  }

  chunks.forEach((chunk, chunkIndex) => {
    let chunkText = '';
    const padded = chunk.padStart(4, '0');
    for (let i = 0; i < padded.length; i += 1) {
      const digit = Number.parseInt(padded[i], 10);
      const unitIndex = padded.length - i - 1;
      if (digit === 0) {
        if (!chunkText.endsWith('零') && chunkText !== '') {
          chunkText += '零';
        }
      } else {
        chunkText += digits[digit] + units[unitIndex];
      }
    }

    chunkText = chunkText.replace(/零+$/g, '');
    if (chunkText) {
      integerText += chunkText + groupUnits[chunks.length - chunkIndex - 1];
    }
  });

  integerText = integerText || '零';
  integerText = integerText.replace(/零+/g, '零').replace(/零万/g, '万').replace(/零亿/g, '亿');

  const jiao = Number.parseInt(decimalPart[0], 10);
  const fen = Number.parseInt(decimalPart[1], 10);
  let decimalText = '';
  if (jiao > 0) {
    decimalText += `${digits[jiao]}角`;
  }
  if (fen > 0) {
    decimalText += `${digits[fen]}分`;
  }

  return `${integerText}元${decimalText || '整'}`;
}
