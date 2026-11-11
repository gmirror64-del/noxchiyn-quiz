(() => {
  'use strict';
  const VALID_CATEGORIES = ['language', 'etiquette', 'history_geo', 'life'];
  const VALID_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
  const categoryNames = { language: 'Язык', etiquette: 'Этикет', history_geo: 'История и край', life: 'Быт' };
  const difficultyNames = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный', expert: 'Хардкор' };
  const els = {
    start: document.querySelector('#startScreen'), quiz: document.querySelector('#quizScreen'), result: document.querySelector('#resultScreen'), difficulty: document.querySelector('#difficulty'), available: document.querySelector('#availableCount'), startButton: document.querySelector('#startButton'), dataStatus: document.querySelector('#dataStatus'), error: document.querySelector('#errorMessage'), exit: document.querySelector('#exitButton'), counter: document.querySelector('#questionCounter'), score: document.querySelector('#scoreCounter'), progress: document.querySelector('#progressFill'), category: document.querySelector('#categoryBadge'), difficultyBadge: document.querySelector('#difficultyBadge'), question: document.querySelector('#questionText'), card: document.querySelector('#questionCard'), options: document.querySelector('#options'), explanation: document.querySelector('#explanation'), explanationText: document.querySelector('#explanationText'), next: document.querySelector('#nextButton'), percent: document.querySelector('#percentResult'), ring: document.querySelector('#resultRing'), resultTitle: document.querySelector('#resultTitle'), resultDescription: document.querySelector('#resultDescription'), scoreResult: document.querySelector('#scoreResult'), copy: document.querySelector('#copyButton'), restart: document.querySelector('#restartButton'), copyMessage: document.querySelector('#copyMessage')
  };
  let questions = [], activeQuestions = [], currentIndex = 0, correctAnswers = 0;

  function showScreen(name) { Object.entries({ start: els.start, quiz: els.quiz, result: els.result }).forEach(([key, node]) => { node.hidden = key !== name; }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function setError(message = '') { els.error.textContent = message; els.error.hidden = !message; }
  function validateQuestions(data) {
    if (!Array.isArray(data) || data.length === 0) throw new Error('В JSON должен быть непустой массив вопросов.');
    const ids = new Set();
    data.forEach((item, index) => {
      const prefix = `Вопрос ${index + 1}:`;
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`${prefix} объект вопроса указан неверно.`);
      if (!(Number.isInteger(item.id) || typeof item.id === 'string') || String(item.id).trim() === '') throw new Error(`${prefix} поле id обязательно.`);
      if (ids.has(String(item.id))) throw new Error(`${prefix} id должен быть уникальным.`); ids.add(String(item.id));
      if (!VALID_CATEGORIES.includes(item.category)) throw new Error(`${prefix} неизвестная category.`);
      if (!VALID_DIFFICULTIES.includes(item.difficulty)) throw new Error(`${prefix} неизвестная difficulty.`);
      if (typeof item.question !== 'string' || !item.question.trim()) throw new Error(`${prefix} нужен текст question.`);
      if (!Array.isArray(item.options) || item.options.length < 2 || item.options.some(option => typeof option !== 'string' || !option.trim())) throw new Error(`${prefix} options — массив минимум из двух непустых строк.`);
      if (!Number.isInteger(item.correctIndex) || item.correctIndex < 0 || item.correctIndex >= item.options.length) throw new Error(`${prefix} correctIndex не соответствует вариантам.`);
      if (typeof item.explanation !== 'string' || !item.explanation.trim()) throw new Error(`${prefix} нужен текст explanation.`);
    });
    return data;
  }
  function updateAvailable() { const selected = els.difficulty.value; const count = questions.filter(q => selected === 'all' || q.difficulty === selected).length; els.available.textContent = `Доступно вопросов: ${count}`; els.startButton.disabled = count === 0; }
  function shuffle(list) { const result = [...list]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
  function renderQuestion() {
    const q = activeQuestions[currentIndex]; els.counter.textContent = `Вопрос ${currentIndex + 1} из ${activeQuestions.length}`; els.score.textContent = `${correctAnswers} верных`; els.progress.style.width = `${(currentIndex / activeQuestions.length) * 100}%`;
    els.category.textContent = categoryNames[q.category]; els.difficultyBadge.textContent = difficultyNames[q.difficulty]; els.question.textContent = q.question; els.options.replaceChildren(); els.explanation.hidden = true; els.explanationText.textContent = q.explanation;
    q.options.forEach((option, index) => { const button = document.createElement('button'); button.className = 'answer-button'; button.type = 'button'; button.dataset.index = String(index); button.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(option)}</span>`; button.addEventListener('click', () => answer(index)); els.options.append(button); });
  }
  function escapeHtml(value) { const node = document.createElement('div'); node.textContent = value; return node.innerHTML; }
  function answer(selectedIndex) { const q = activeQuestions[currentIndex]; const isCorrect = selectedIndex === q.correctIndex; els.options.querySelectorAll('.answer-button').forEach(button => { const index = Number(button.dataset.index); button.disabled = true; if (index === q.correctIndex) button.classList.add('correct'); if (!isCorrect && index === selectedIndex) button.classList.add('wrong'); }); if (isCorrect) correctAnswers += 1; els.score.textContent = `${correctAnswers} верных`; els.explanation.hidden = false; }
  function startQuiz() { const filter = els.difficulty.value; activeQuestions = shuffle(questions.filter(q => filter === 'all' || q.difficulty === filter)); if (!activeQuestions.length) return; currentIndex = 0; correctAnswers = 0; setError(); showScreen('quiz'); renderQuestion(); }
  function nextQuestion() { currentIndex += 1; if (currentIndex >= activeQuestions.length) renderResult(); else renderQuestion(); }
  function renderResult() { const percent = Math.round((correctAnswers / activeQuestions.length) * 100); let title, description; if (percent <= 35) { title = 'Турист'; description = 'Поверхностный уровень — самое время углубиться в матчасть и открыть для себя больше деталей.'; } else if (percent <= 65) { title = 'Хьаша'; description = 'Неплохо: ты уверенно ориентируешься в теме, но некоторые тонкости ещё ждут тебя.'; } else if (percent <= 85) { title = 'ГIиллакх ду хьуна'; description = 'Отличный уровень знания адатов и языка. Твоя любознательность вызывает уважение.'; } else { title = 'Къонах / Аксакал'; description = 'Знание башенной архитектуры, истории и диалектов — на уровне исследователя.'; } els.percent.textContent = `${percent}%`; els.ring.style.borderColor = percent >= 66 ? '#10b981' : percent >= 36 ? '#f59e0b' : '#ef4444'; els.resultTitle.textContent = title; els.resultDescription.textContent = description; els.scoreResult.textContent = `${correctAnswers} / ${activeQuestions.length}`; els.copyMessage.textContent = ''; showScreen('result'); }
  async function copyResult() { const text = `Нохчийн Квиз\n${els.resultTitle.textContent} — ${els.percent.textContent}\n${correctAnswers} из ${activeQuestions.length} правильных ответов.\nПроверь свои знания традиций, истории и языка!`; try { await navigator.clipboard.writeText(text); els.copyMessage.textContent = 'Результат скопирован в буфер обмена.'; } catch { const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.append(textarea); textarea.select(); const success = document.execCommand('copy'); textarea.remove(); els.copyMessage.textContent = success ? 'Результат скопирован в буфер обмена.' : 'Не удалось скопировать — выделите текст вручную.'; } }
  async function loadDefault() { try { const response = await fetch('./questions.json', { cache: 'no-store' }); if (!response.ok) throw new Error(response.status === 404 ? 'файл questions.json не найден' : `сервер вернул ошибку ${response.status}`); questions = validateQuestions(await response.json()); updateAvailable(); els.dataStatus.textContent = `База Нохчийн Квиза загружена: ${questions.length} вопросов`; } catch (error) { els.startButton.disabled = true; els.available.textContent = 'Вопросы недоступны'; els.dataStatus.textContent = 'Не удалось загрузить локальную базу'; setError(`База вопросов сейчас недоступна. Проверьте, что файл questions.json опубликован рядом с index.html, затем обновите страницу. (${error.message})`); } }
  els.difficulty.addEventListener('change', updateAvailable); els.startButton.addEventListener('click', startQuiz); els.next.addEventListener('click', nextQuestion); els.exit.addEventListener('click', () => showScreen('start')); els.restart.addEventListener('click', () => showScreen('start')); els.copy.addEventListener('click', copyResult);
  loadDefault();
})();
