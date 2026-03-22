/* mrzocchi.com — Dashboard JS */

function showSection(btn, id) {
  var container = btn.closest('.term-content') || btn.closest('.dash-layout');
  container.querySelectorAll('.sidebar-item').forEach(function(b) { b.classList.remove('active'); });
  container.querySelectorAll('.dash-content-section').forEach(function(s) { s.classList.remove('active'); });
  btn.classList.add('active');
  var el = document.getElementById(id);
  if (el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
    el.classList.add('active');
  }
  var main = container.querySelector('.dash-main');
  if (main) main.scrollTop = 0;
}

function toggleGame(btn, url) {
  var card = btn.closest('.game-embed-card');
  var frame = card.querySelector('.game-embed-frame');
  if (frame.style.display === 'none') {
    frame.style.display = 'block';
    frame.querySelector('.game-embed-placeholder').innerHTML = '<iframe src="' + url + '" class="game-iframe" allowfullscreen></iframe>';
    btn.innerHTML = '<span>⏹</span> Close Game';
    btn.classList.add('game-embed-active');
  } else {
    frame.style.display = 'none';
    frame.querySelector('.game-embed-placeholder').innerHTML = '';
    btn.innerHTML = '<span>▶</span> Play Here';
    btn.classList.remove('game-embed-active');
  }
}

/* ── QUIZ ENGINE ── */
var quizState = {};

function quizSetMode(btn, mode, termNum) {
  var section = btn.closest('.dash-content-section');
  section.querySelectorAll('.quiz-mode-btn').forEach(function(b) { b.classList.remove('quiz-mode-active'); });
  btn.classList.add('quiz-mode-active');
  var browse = section.querySelector('[data-quiz-browse="' + termNum + '"]');
  var test = section.querySelector('[data-quiz-test="' + termNum + '"]');
  if (mode === 'browse') {
    browse.style.display = '';
    test.style.display = 'none';
  } else {
    browse.style.display = 'none';
    test.style.display = '';
    quizStartTest(termNum);
  }
}

function quizStartTest(termNum) {
  var dataEl = document.querySelector('.quiz-data-' + termNum);
  if (!dataEl) return;
  var questions = JSON.parse(dataEl.textContent);
  for (var i = questions.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = questions[i]; questions[i] = questions[j]; questions[j] = tmp;
  }
  quizState[termNum] = { questions: questions, current: 0, results: { got: 0, close: 0, miss: 0 } };
  var section = document.querySelector('[data-quiz-test="' + termNum + '"]');
  section.querySelector('.quiz-test-inner').style.display = '';
  section.querySelector('.quiz-test-results').style.display = 'none';
  quizShowQuestion(termNum);
}

function quizClean(s) { return s.replace(/^"+|"+$/g, ''); }

function quizShowQuestion(termNum) {
  var s = quizState[termNum];
  var section = document.querySelector('[data-quiz-test="' + termNum + '"]');
  var q = s.questions[s.current];
  var total = s.questions.length;
  section.querySelector('.quiz-test-fill').style.width = ((s.current / total) * 100) + '%';
  section.querySelector('.quiz-test-count').textContent = (s.current + 1) + ' / ' + total;
  section.querySelector('.quiz-test-q').textContent = quizClean(q.q);
  section.querySelector('.quiz-test-answer').style.display = 'none';
  section.querySelector('.quiz-test-answer').textContent = quizClean(q.a);
  section.querySelector('.quiz-test-rate').style.display = 'none';
  section.querySelector('.quiz-test-reveal-btn').style.display = '';
}

function quizRevealAnswer(termNum) {
  var section = document.querySelector('[data-quiz-test="' + termNum + '"]');
  section.querySelector('.quiz-test-answer').style.display = '';
  section.querySelector('.quiz-test-rate').style.display = '';
  section.querySelector('.quiz-test-reveal-btn').style.display = 'none';
}

function quizRate(termNum, rating) {
  var s = quizState[termNum];
  s.results[rating]++;
  s.current++;
  if (s.current >= s.questions.length) {
    quizShowResults(termNum);
  } else {
    quizShowQuestion(termNum);
  }
}

function quizShowResults(termNum) {
  var s = quizState[termNum];
  var r = s.results;
  var total = s.questions.length;
  var section = document.querySelector('[data-quiz-test="' + termNum + '"]');
  section.querySelector('.quiz-test-inner').style.display = 'none';
  var results = section.querySelector('.quiz-test-results');
  results.style.display = '';
  var pct = Math.round((r.got / total) * 100);
  var emoji = pct >= 80 ? '🌟' : pct >= 60 ? '💪' : pct >= 40 ? '📚' : '🔄';
  var title = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good effort!' : pct >= 40 ? 'Keep practising!' : 'Time to review!';
  results.querySelector('.quiz-results-emoji').textContent = emoji;
  results.querySelector('.quiz-results-title').textContent = title;
  results.querySelector('.quiz-results-detail').textContent = r.got + ' correct, ' + r.close + ' almost, ' + r.miss + ' to review out of ' + total + ' questions.';
  var bars = results.querySelector('.quiz-results-bars');
  bars.innerHTML =
    '<div class="quiz-result-row"><span class="quiz-result-label">✅ Got it</span><div class="quiz-result-track"><div class="quiz-result-fill quiz-fill-got" style="width:' + ((r.got/total)*100) + '%"></div></div><span class="quiz-result-num">' + r.got + '</span></div>' +
    '<div class="quiz-result-row"><span class="quiz-result-label">🟡 Almost</span><div class="quiz-result-track"><div class="quiz-result-fill quiz-fill-close" style="width:' + ((r.close/total)*100) + '%"></div></div><span class="quiz-result-num">' + r.close + '</span></div>' +
    '<div class="quiz-result-row"><span class="quiz-result-label">❌ Missed</span><div class="quiz-result-track"><div class="quiz-result-fill quiz-fill-miss" style="width:' + ((r.miss/total)*100) + '%"></div></div><span class="quiz-result-num">' + r.miss + '</span></div>';
  try {
    localStorage.setItem('quiz-' + termNum + '-' + window.location.pathname, JSON.stringify({ got: r.got, close: r.close, miss: r.miss, total: total, date: new Date().toISOString().split('T')[0] }));
  } catch(e) {}
}
