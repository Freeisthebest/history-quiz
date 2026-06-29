(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QuizCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function normalizeAnswer(answer) {
    if (!Array.isArray(answer)) return [];
    return Array.from(new Set(answer.map(String).map((item) => item.trim().toUpperCase()).filter(Boolean))).sort();
  }

  function answersEqual(left, right) {
    const a = normalizeAnswer(left);
    const b = normalizeAnswer(right);
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  function shuffle(items, randomFn) {
    const rand = randomFn || Math.random;
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rand() * (index + 1));
      const temp = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = temp;
    }
    return copy;
  }

  function sampleQuestions(items, count, label, randomFn) {
    if (!Array.isArray(items) || items.length < count) {
      throw new Error(`${label}不足：需要 ${count} 道，当前 ${Array.isArray(items) ? items.length : 0} 道`);
    }
    return shuffle(items, randomFn).slice(0, count);
  }

  function cloneQuestion(question) {
    return {
      id: question.id,
      sourceNo: question.sourceNo || '',
      type: question.type,
      question: question.question,
      options: Object.assign({}, question.options),
      answer: normalizeAnswer(question.answer),
      explanation: question.explanation || '',
    };
  }

  function buildPaper(bank, singleCount, multipleCount, randomFn) {
    const singles = sampleQuestions(bank.single, singleCount, '单选题', randomFn).map(cloneQuestion);
    const multiples = sampleQuestions(bank.multiple, multipleCount, '多选题', randomFn).map(cloneQuestion);
    return singles.concat(multiples);
  }

  function createWrongRecord(details) {
    return {
      paperId: details.paperId,
      questionId: details.question.id,
      sourceNo: details.question.sourceNo || '',
      type: details.question.type,
      question: details.question.question,
      options: Object.assign({}, details.question.options),
      correctAnswer: normalizeAnswer(details.question.answer),
      userAnswer: normalizeAnswer(details.userAnswer),
      explanation: details.question.explanation || '',
      answeredAt: (details.now || new Date()).toISOString(),
    };
  }

  function answerFor(question, answers) {
    return normalizeAnswer((answers || {})[question.id] || []);
  }

  function classifyPaper(paper, answers) {
    return (paper || []).reduce((groups, question) => {
      const userAnswer = answerFor(question, answers);
      if (!userAnswer.length) {
        groups.unanswered.push(question);
      } else if (answersEqual(userAnswer, question.answer)) {
        groups.correct.push(question);
      } else {
        groups.wrong.push(question);
      }
      return groups;
    }, { correct: [], wrong: [], unanswered: [] });
  }

  function createWrongRecordsForPaper(details) {
    const groups = classifyPaper(details.paper, details.answers);
    return groups.wrong.map((question) => createWrongRecord({
      paperId: details.paperId,
      question,
      userAnswer: answerFor(question, details.answers),
      now: details.now,
    }));
  }

  return {
    normalizeAnswer,
    answersEqual,
    buildPaper,
    createWrongRecord,
    classifyPaper,
    createWrongRecordsForPaper,
  };
});
