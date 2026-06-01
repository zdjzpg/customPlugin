function splitCsv(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeWord(value) {
  return String(value || '').trim().toLowerCase();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getNewQuestionTypeDefaults(type) {
  if (type === 'listen_answer_question') {
    return {
      type,
      score: 10,
      prompt: '听问题并回答。',
      questionText: 'What is your favorite fruit?',
      answerKeywordsText: 'apple, red apple',
      minMatchCount: 1,
      autoPlay: true
    };
  }

  if (type === 'listen_choose_letter') {
    return {
      type,
      score: 10,
      prompt: '听一听，选出正确字母。',
      targetLetter: 'a',
      candidateLettersText: 'a, b, c, d',
      requireBothCases: false,
      autoPlay: true
    };
  }

  if (type === 'read_sentence_with_image') {
    return {
      type,
      score: 15,
      prompt: '看图读句子。',
      imageUrl: '',
      sentenceText: 'This is a rabbit.',
      autoPlay: false
    };
  }

  if (type === 'match_image_word') {
    return {
      type,
      score: 20,
      prompt: '把图片和单词连起来。',
      pairs: [
        { id: 'pair_1', imageUrl: '', word: 'apple' },
        { id: 'pair_2', imageUrl: '', word: 'pear' }
      ]
    };
  }

  return null;
}

function buildLetterOptions(targetLetter, candidateLettersText, requireBothCases) {
  const baseLetters = unique(
    [targetLetter, ...splitCsv(candidateLettersText)].map((item) => normalizeWord(item)).filter(Boolean)
  );

  if (requireBothCases) {
    return baseLetters.flatMap((item) => [item.toUpperCase(), item.toLowerCase()]);
  }

  return baseLetters.map((item) => item.toLowerCase());
}

function normalizePairs(pairs) {
  return (Array.isArray(pairs) ? pairs : [])
    .map((pair, index) => ({
      id: pair.id || `pair_${index + 1}`,
      imageUrl: String(pair.imageUrl || '').trim(),
      word: String(pair.word || '').trim()
    }))
    .filter((pair) => pair.imageUrl || pair.word);
}

function normalizeNewQuestionType(question) {
  if (question.type === 'listen_answer_question') {
    const answerKeywords = splitCsv(question.answerKeywordsText).map(normalizeWord);
    return {
      id: question.id,
      type: question.type,
      score: Number(question.score) || 0,
      prompt: question.prompt || '',
      questionText: question.questionText || '',
      answerKeywords,
      answerKeywordsText: question.answerKeywordsText || '',
      minMatchCount: Math.max(1, Number(question.minMatchCount) || 1),
      autoPlay: question.autoPlay !== false
    };
  }

  if (question.type === 'listen_choose_letter') {
    const requireBothCases = question.requireBothCases === true;
    const normalizedTarget = normalizeWord(question.targetLetter).slice(0, 1);
    const options = buildLetterOptions(normalizedTarget, question.candidateLettersText, requireBothCases);
    return {
      id: question.id,
      type: question.type,
      score: Number(question.score) || 0,
      prompt: question.prompt || '',
      targetLetter: normalizedTarget,
      candidateLettersText: question.candidateLettersText || '',
      requireBothCases,
      autoPlay: question.autoPlay !== false,
      targetLetters: requireBothCases ? [normalizedTarget.toUpperCase(), normalizedTarget.toLowerCase()] : [normalizedTarget],
      options
    };
  }

  if (question.type === 'read_sentence_with_image') {
    const sentenceText = String(question.sentenceText || '').trim();
    return {
      id: question.id,
      type: question.type,
      score: Number(question.score) || 0,
      prompt: question.prompt || '',
      imageUrl: String(question.imageUrl || '').trim(),
      sentenceText,
      phrase: sentenceText,
      autoPlay: question.autoPlay === true
    };
  }

  if (question.type === 'match_image_word') {
    return {
      id: question.id,
      type: question.type,
      score: Number(question.score) || 0,
      prompt: question.prompt || '',
      pairs: normalizePairs(question.pairs)
    };
  }

  return null;
}

function evaluateListenAnswerQuestion(question, answer) {
  const transcript = String(answer.transcript || '').trim();
  const normalizedTranscript = normalizeWord(transcript);
  const matchedKeywords = unique((question.answerKeywords || []).filter((keyword) => normalizedTranscript.includes(keyword)));
  const gained = matchedKeywords.length >= (question.minMatchCount || 1) ? question.score : 0;

  return {
    correctText: (question.answerKeywords || []).join(', ') || '未配置关键词',
    studentText: transcript || '未识别',
    gained,
    matchedKeywords
  };
}

function evaluateListenChooseLetter(question, answer) {
  const selectedLetters = unique((answer.selectedLetters || []).map((item) => String(item || '').trim()).filter(Boolean));
  let isCorrect = false;

  if (question.requireBothCases) {
    isCorrect = (question.targetLetters || []).every((item) => selectedLetters.includes(item));
  } else {
    isCorrect = selectedLetters.some((item) => normalizeWord(item) === normalizeWord(question.targetLetter));
  }

  return {
    correctText: question.requireBothCases
      ? (question.targetLetters || []).join(' + ')
      : String(question.targetLetter || '').toUpperCase(),
    studentText: selectedLetters.join(', ') || '未作答',
    gained: isCorrect ? question.score : 0
  };
}

function evaluateReadSentenceWithImage(question, answer) {
  const transcript = String(answer.transcript || '').trim();
  const autoScore = Number(answer.autoScore || 0);

  return {
    correctText: question.sentenceText || '',
    studentText: transcript || '未识别',
    gained: Math.round((autoScore / 100) * question.score)
  };
}

function evaluateMatchImageWord(question, answer) {
  const matches = answer.matches || {};
  const pairs = Array.isArray(question.pairs) ? question.pairs : [];
  const correctCount = pairs.reduce((sum, pair) => sum + (matches[pair.id] === pair.word ? 1 : 0), 0);
  const total = pairs.length || 1;
  const gained = Math.round((correctCount / total) * question.score);

  return {
    correctText: pairs.map((pair) => `${pair.id}:${pair.word}`).join(' | ') || '未配置配对',
    studentText: Object.keys(matches).length
      ? Object.entries(matches).map(([pairId, word]) => `${pairId}:${word}`).join(' | ')
      : '未作答',
    gained
  };
}

function evaluateNewQuestionAnswer(question, answer) {
  if (question.type === 'listen_answer_question') {
    return evaluateListenAnswerQuestion(question, answer);
  }
  if (question.type === 'listen_choose_letter') {
    return evaluateListenChooseLetter(question, answer);
  }
  if (question.type === 'read_sentence_with_image') {
    return evaluateReadSentenceWithImage(question, answer);
  }
  if (question.type === 'match_image_word') {
    return evaluateMatchImageWord(question, answer);
  }
  return null;
}

module.exports = {
  getNewQuestionTypeDefaults,
  normalizeNewQuestionType,
  evaluateNewQuestionAnswer,
  buildLetterOptions
};
