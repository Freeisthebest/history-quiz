(function () {
  const SINGLE_COUNT = 40;
  const MULTIPLE_COUNT = 20;
  const STORAGE_KEY = 'historyQuizWrongRecordsV1';

  const state = {
    paper: [],
    answers: {},
    currentIndex: 0,
    submitted: false,
    paperId: '',
    view: 'quiz',
  };

  const els = {
    errorBox: document.getElementById('errorBox'),
    summaryBar: document.getElementById('summaryBar'),
    questionPanel: document.getElementById('questionPanel'),
    resultPanel: document.getElementById('resultPanel'),
    historyPanel: document.getElementById('historyPanel'),
    answerCard: document.getElementById('answerCard'),
    sheetStats: document.getElementById('sheetStats'),
    newPaperBtn: document.getElementById('newPaperBtn'),
    historyBtn: document.getElementById('historyBtn'),
    submitBtn: document.getElementById('submitBtn'),
  };

  function showError(message) {
    els.errorBox.textContent = message;
    els.errorBox.classList.remove('hidden');
  }

  function clearError() {
    els.errorBox.textContent = '';
    els.errorBox.classList.add('hidden');
  }

  function getBankCounts() {
    const bank = window.QUESTION_BANK || { single: [], multiple: [] };
    return {
      single: Array.isArray(bank.single) ? bank.single.length : 0,
      multiple: Array.isArray(bank.multiple) ? bank.multiple.length : 0,
    };
  }

  function startPaper() {
    clearError();
    try {
      state.paper = window.QuizCore.buildPaper(window.QUESTION_BANK, SINGLE_COUNT, MULTIPLE_COUNT);
      state.answers = {};
      state.currentIndex = 0;
      state.submitted = false;
      state.paperId = `paper-${Date.now()}`;
      state.view = 'quiz';
      render();
    } catch (error) {
      showError(error.message);
      renderEmpty();
    }
  }

  function renderEmpty() {
    const counts = getBankCounts();
    els.summaryBar.innerHTML = `题库：单选 <strong>${counts.single}</strong> 道，多选 <strong>${counts.multiple}</strong> 道。每次需要 40 道单选和 20 道多选。`;
    els.questionPanel.innerHTML = '<h2>题库数量不足</h2><p>请先补充题库后再开始答题。</p>';
    els.answerCard.innerHTML = '';
    els.sheetStats.textContent = '';
    els.resultPanel.classList.add('hidden');
    els.historyPanel.classList.add('hidden');
  }

  function currentQuestion() {
    return state.paper[state.currentIndex];
  }

  function selectedAnswer(question) {
    return window.QuizCore.normalizeAnswer(state.answers[question.id] || []);
  }

  function optionEntries(question) {
    return Object.keys(question.options)
      .sort()
      .map((key) => [key, question.options[key]]);
  }

  function setView(view) {
    state.view = view;
    render();
  }

  function render() {
    renderSummary();
    renderAnswerCard();
    if (state.view === 'history') {
      renderHistory();
      els.questionPanel.classList.add('hidden');
      els.resultPanel.classList.add('hidden');
      els.historyPanel.classList.remove('hidden');
      return;
    }
    els.questionPanel.classList.remove('hidden');
    els.historyPanel.classList.add('hidden');
    renderQuestion();
    renderResultIfNeeded();
  }

  function renderSummary() {
    const counts = getBankCounts();
    const answered = state.paper.filter((question) => selectedAnswer(question).length > 0).length;
    const current = state.paper.length ? state.currentIndex + 1 : 0;
    els.summaryBar.innerHTML = [
      `当前：<strong>${current}</strong> / ${state.paper.length}`,
      `已答：<strong>${answered}</strong> / ${state.paper.length}`,
      `题库：单选 ${counts.single}，多选 ${counts.multiple}`,
      `组卷：前 40 单选，后 20 多选`,
    ].join('<span class="sep">|</span>');
    els.sheetStats.textContent = `${answered}/${state.paper.length}`;
    els.submitBtn.disabled = state.submitted || !state.paper.length;
    els.submitBtn.textContent = state.submitted ? '已交卷' : '交卷';
    els.historyBtn.textContent = state.view === 'history' ? '返回试卷' : '历史错题';
  }

  function renderQuestion() {
    const question = currentQuestion();
    if (!question) {
      els.questionPanel.innerHTML = '<h2>暂无试卷</h2>';
      return;
    }
    const answer = selectedAnswer(question);
    const typeName = question.type === 'multiple' ? '多选题' : '单选题';
    const typeHint = question.type === 'multiple' ? '可选择多个选项' : '只选择一个选项';
    const optionHtml = optionEntries(question).map(([label, text]) => {
      const isSelected = answer.includes(label);
      const isCorrect = question.answer.includes(label);
      const isWrongPick = state.submitted && isSelected && !isCorrect;
      const classes = ['option'];
      if (isSelected) classes.push('selected');
      if (state.submitted && isCorrect) classes.push('correct-answer');
      if (isWrongPick) classes.push('wrong-answer');
      return `<button class="${classes.join(' ')}" type="button" data-option="${label}">
        <span class="option-letter">${label}</span>
        <span class="option-text">${escapeHtml(text)}</span>
      </button>`;
    }).join('');

    els.questionPanel.innerHTML = `
      <div class="question-meta">
        <span class="badge ${question.type === 'multiple' ? 'multi' : ''}">第 ${state.currentIndex + 1} 题 · ${typeName}</span>
        <span class="muted">${typeHint}</span>
      </div>
      <h2 class="question-title">${escapeHtml(question.question)}</h2>
      <div class="options">${optionHtml}</div>
      <div class="question-actions">
        <button class="button light" type="button" data-action="prev">上一题</button>
        <button class="button light" type="button" data-action="next">下一题</button>
        <button class="button ghost" type="button" data-action="clear">清空本题</button>
      </div>
    `;
  }

  function renderAnswerCard() {
    els.answerCard.innerHTML = state.paper.map((question, index) => {
      const classes = ['card-button'];
      const answer = selectedAnswer(question);
      if (index === state.currentIndex && state.view !== 'history') classes.push('current');
      if (answer.length) classes.push('answered');
      if (state.submitted) {
        if (!answer.length) classes.push('unanswered');
        else if (window.QuizCore.answersEqual(answer, question.answer)) classes.push('correct');
        else classes.push('wrong');
      }
      return `<button class="${classes.join(' ')}" type="button" data-index="${index}">${index + 1}</button>`;
    }).join('');
  }

  function renderResultIfNeeded() {
    if (!state.submitted) {
      els.resultPanel.classList.add('hidden');
      return;
    }
    const groups = window.QuizCore.classifyPaper(state.paper, state.answers);
    els.resultPanel.classList.remove('hidden');
    els.resultPanel.innerHTML = `
      <h2>交卷结果</h2>
      <div class="result-grid">
        <div class="result-stat">总题数<strong>${state.paper.length}</strong></div>
        <div class="result-stat">答对<strong>${groups.correct.length}</strong></div>
        <div class="result-stat">答错<strong>${groups.wrong.length}</strong></div>
        <div class="result-stat">未作答<strong>${groups.unanswered.length}</strong></div>
      </div>
      <div class="question-actions">
        <button class="button light" type="button" data-action="history">查看历史错题</button>
        <button class="button primary" type="button" data-action="new">重新组卷</button>
      </div>
      <div class="wrong-list">
        <h3 class="section-title">答错题目</h3>
        ${groups.wrong.map(renderReviewCard).join('') || '<p>本次没有答错题目。</p>'}
        <h3 class="section-title">未作答题目</h3>
        ${groups.unanswered.map(renderUnansweredCard).join('') || '<p>本次没有未作答题目。</p>'}
      </div>
    `;
  }

  function renderHistory() {
    const records = loadWrongRecords();
    els.historyPanel.innerHTML = `
      <div class="question-meta">
        <h2>历史错题</h2>
        <span class="muted">共 ${records.length} 条记录</span>
      </div>
      <div class="question-actions">
        <button class="button light" type="button" data-action="back">返回试卷</button>
        <button class="button ghost" type="button" data-action="clear-history">清空错题记录</button>
      </div>
      <div class="history-list">${records.map(renderHistoryCard).join('') || '<p>还没有历史错题。</p>'}</div>
    `;
  }

  function renderReviewCard(question) {
    return `
      <article class="review-card">
        <h3>${escapeHtml(question.question)}</h3>
        <p>你的答案：${formatAnswer(selectedAnswer(question), question.options) || '未作答'}</p>
        <p>正确答案：${formatAnswer(question.answer, question.options)}</p>
      </article>
    `;
  }

  function renderUnansweredCard(question) {
    return `
      <article class="review-card unanswered-card">
        <h3>${escapeHtml(question.question)}</h3>
        <p>状态：未作答</p>
        <p>正确答案：${formatAnswer(question.answer, question.options)}</p>
      </article>
    `;
  }

  function renderHistoryCard(record) {
    return `
      <article class="review-card">
        <h3>${escapeHtml(record.question)}</h3>
        <p>题型：${record.type === 'multiple' ? '多选题' : '单选题'} · 时间：${formatDate(record.answeredAt)}</p>
        <p>你的答案：${formatAnswer(record.userAnswer, record.options) || '未作答'}</p>
        <p>正确答案：${formatAnswer(record.correctAnswer, record.options)}</p>
      </article>
    `;
  }

  function chooseOption(label) {
    if (state.submitted) return;
    const question = currentQuestion();
    if (!question) return;
    const answer = selectedAnswer(question);
    if (question.type === 'single') {
      state.answers[question.id] = [label];
    } else if (answer.includes(label)) {
      state.answers[question.id] = answer.filter((item) => item !== label);
    } else {
      state.answers[question.id] = answer.concat(label).sort();
    }
    render();
  }

  function move(delta) {
    if (!state.paper.length) return;
    state.currentIndex = Math.max(0, Math.min(state.paper.length - 1, state.currentIndex + delta));
    setView('quiz');
  }

  function submitPaper() {
    if (state.submitted || !state.paper.length) return;
    state.submitted = true;
    const wrongRecords = window.QuizCore.createWrongRecordsForPaper({
      paperId: state.paperId,
      paper: state.paper,
      answers: state.answers,
    });
    saveWrongRecords(wrongRecords);
    setView('quiz');
  }

  function saveWrongRecords(records) {
    if (!records.length) return;
    const history = records.concat(loadWrongRecords());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  function loadWrongRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function clearWrongHistory() {
    if (!confirm('确定清空历史错题记录吗？')) return;
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }

  function formatAnswer(answer, options) {
    return window.QuizCore.normalizeAnswer(answer).map((label) => `${label}. ${options[label] || ''}`).join('；');
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '';
    return date.toLocaleString('zh-CN', { hour12: false });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('click', (event) => {
    const optionButton = event.target.closest('[data-option]');
    if (optionButton) {
      chooseOption(optionButton.dataset.option);
      return;
    }

    const cardButton = event.target.closest('[data-index]');
    if (cardButton) {
      state.currentIndex = Number(cardButton.dataset.index);
      setView('quiz');
      return;
    }

    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    if (action === 'prev') move(-1);
    if (action === 'next') move(1);
    if (action === 'clear' && !state.submitted) {
      delete state.answers[currentQuestion().id];
      render();
    }
    if (action === 'history') setView('history');
    if (action === 'back') setView('quiz');
    if (action === 'new') startPaper();
    if (action === 'clear-history') clearWrongHistory();
  });

  els.newPaperBtn.addEventListener('click', startPaper);
  els.historyBtn.addEventListener('click', () => setView(state.view === 'history' ? 'quiz' : 'history'));
  els.submitBtn.addEventListener('click', submitPaper);

  startPaper();
})();
