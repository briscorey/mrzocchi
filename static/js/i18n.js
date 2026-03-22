/* ── mrzocchi i18n — EN / 中文 / 한국어 ── */
(function() {
  var translations = {
    /* ── Header & Global Nav ── */
    "nav.parents": { zh: "家长信息", ko: "학부모 안내" },
    "nav.explain": { zh: "💡 解释", ko: "💡 설명" },
    "nav.revise": { zh: "复习方法", ko: "복습 방법" },
    "nav.about": { zh: "关于老师", ko: "소개" },
    "nav.subtitle": { zh: "MYP 数学与科学 · 南京国际学校", ko: "MYP 수학 & 과학 · NIS" },

    /* ── Homepage ── */
    "home.grade6": { zh: "六年级", ko: "6학년" },
    "home.grade7": { zh: "七年级", ko: "7학년" },
    "home.grade8": { zh: "八年级", ko: "8학년" },
    "home.maths": { zh: "📐 数学", ko: "📐 수학" },
    "home.science": { zh: "🔬 科学", ko: "🔬 과학" },

    /* ── Dashboard Sidebar ── */
    "sidebar.nav": { zh: "导航", ko: "탐색" },
    "sidebar.outline": { zh: "单元概要", ko: "단원 개요" },
    "sidebar.criteria": { zh: "评估标准", ko: "평가 기준" },
    "sidebar.ppts": { zh: "课件", ko: "프레젠테이션" },
    "sidebar.worksheets": { zh: "练习册", ko: "워크시트" },
    "sidebar.games": { zh: "游戏", ko: "게임" },
    "sidebar.videos": { zh: "视频", ko: "영상" },
    "sidebar.glossary": { zh: "词汇表", ko: "용어집" },
    "sidebar.explore": { zh: "探索工具", ko: "탐구 도구" },
    "sidebar.quiz": { zh: "自测", ko: "자기 테스트" },
    "sidebar.toolkit": { zh: "数学工具", ko: "수학 도구" },
    "sidebar.labs": { zh: "实验", ko: "실험" },

    /* ── Dashboard Section Headings ── */
    "heading.outline": { zh: "单元概要", ko: "단원 개요" },
    "heading.criteria": { zh: "评估标准", ko: "평가 기준" },
    "heading.ppts": { zh: "课件", ko: "프레젠테이션" },
    "heading.worksheets": { zh: "练习册", ko: "워크시트" },
    "heading.games": { zh: "复习游戏", ko: "복습 게임" },
    "heading.videos": { zh: "视频", ko: "영상" },
    "heading.glossary": { zh: "核心词汇", ko: "핵심 용어" },
    "heading.explore": { zh: "探索与互动", ko: "탐구 & 체험" },
    "heading.quiz": { zh: "自我测试", ko: "자기 테스트" },
    "heading.toolkit": { zh: "数学工具箱", ko: "수학 도구" },

    /* ── Unit Outline ── */
    "unit.back": { zh: "← 返回首页", ko: "← 홈으로" },
    "journey.title": { zh: "🗺️ 你的学习旅程", ko: "🗺️ 학습 여정" },

    /* ── Quiz UI ── */
    "quiz.browse_intro": { zh: "点击问题，查看答案。", ko: "질문을 클릭하면 답이 보입니다." },
    "quiz.mode_browse": { zh: "📖 浏览全部", ko: "📖 전체 보기" },
    "quiz.mode_test": { zh: "🧠 测试一下", ko: "🧠 테스트" },
    "quiz.show_answer": { zh: "显示答案", ko: "정답 보기" },
    "quiz.how_did": { zh: "你做得怎样？", ko: "어떻게 했나요?" },
    "quiz.got": { zh: "✅ 掌握了", ko: "✅ 맞았어요" },
    "quiz.almost": { zh: "🟡 差不多", ko: "🟡 거의 맞았어요" },
    "quiz.missed": { zh: "❌ 不会", ko: "❌ 몰랐어요" },
    "quiz.try_again": { zh: "再试一次", ko: "다시 하기" },
    "quiz.browse_qs": { zh: "浏览题目", ko: "문제 보기" },
    "quiz.excellent": { zh: "太棒了！", ko: "훌륭해요!" },
    "quiz.good": { zh: "不错！", ko: "잘했어요!" },
    "quiz.keep": { zh: "继续努力！", ko: "계속 연습하세요!" },
    "quiz.review": { zh: "需要复习！", ko: "복습이 필요해요!" },

    /* ── Explore UI ── */
    "explore.intro": { zh: "本单元的互动模拟和工具。", ko: "이 단원의 실습 시뮬레이션과 도구입니다." },
    "explore.launch": { zh: "▶ 启动模拟", ko: "▶ 시뮬레이션 열기" },
    "explore.open": { zh: "↗ 打开链接", ko: "↗ 링크 열기" },

    /* ── Game UI ── */
    "game.play": { zh: "▶ 在此游玩", ko: "▶ 여기서 플레이" },
    "game.newtab": { zh: "↗ 新标签", ko: "↗ 새 탭" },

    /* ── Glossary ── */
    "glossary.intro.sci": { zh: "本单元的核心词汇。用这些来积累科学词汇。", ko: "이 단원의 핵심 용어입니다." },
    "glossary.intro.math": { zh: "本单元的核心词汇。用这些来积累数学词汇。", ko: "이 단원의 핵심 용어입니다." },

    /* ── Footer ── */
    "footer.grades": { zh: "年级", ko: "학년" },
    "footer.resources": { zh: "资源", ko: "자료" },
    "footer.info": { zh: "信息", ko: "정보" },
    "footer.built": { zh: "为学生而建", ko: "학생을 위해" },
  };

  var currentLang = localStorage.getItem('mrzocchi-lang') || 'en';

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('mrzocchi-lang', lang);

    document.querySelectorAll('.lang-btn').forEach(function(b) {
      b.classList.toggle('lang-btn-active', b.dataset.lang === lang);
    });

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.dataset.i18n;
      var t = translations[key];
      if (lang === 'en') {
        if (el.dataset.en) el.textContent = el.dataset.en;
      } else if (t && t[lang]) {
        if (!el.dataset.en) el.dataset.en = el.textContent;
        el.textContent = t[lang];
      }
    });

    // Glossary Chinese always visible as bilingual aid
    document.querySelectorAll('.glossary-zh').forEach(function(el) {
      el.style.display = '';
    });
  }

  function init() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var toggle = document.createElement('div');
    toggle.className = 'lang-toggle';
    toggle.innerHTML =
      '<button class="lang-btn" data-lang="en" onclick="window.__setLang(\'en\')"><span class="lang-flag">🇬🇧</span><span class="lang-label">EN</span></button>' +
      '<button class="lang-btn" data-lang="zh" onclick="window.__setLang(\'zh\')"><span class="lang-flag">🇨🇳</span><span class="lang-label">中文</span></button>' +
      '<button class="lang-btn" data-lang="ko" onclick="window.__setLang(\'ko\')"><span class="lang-flag">🇰🇷</span><span class="lang-label">한국어</span></button>';

    var nav = header.querySelector('.header-nav');
    if (nav) header.insertBefore(toggle, nav);
    else header.appendChild(toggle);

    window.__setLang = applyLanguage;
    applyLanguage(currentLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
