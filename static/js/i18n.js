/* ── mrzocchi i18n — EN / 中文 / 한국어 ── */
(function() {
  var translations = {
    /* ── Header & Global Nav ── */
    "nav.parents": { zh: "家长信息", ko: "학부모 안내" },
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
    "heading.ppts": { zh: "课件", ko: "프레젠테이션" },
    "heading.worksheets": { zh: "练习册", ko: "워크시트" },
    "heading.games": { zh: "复习游戏", ko: "복습 게임" },
    "heading.videos": { zh: "视频", ko: "영상" },
    "heading.glossary": { zh: "核心词汇", ko: "핵심 용어" },
    "heading.explore": { zh: "探索与互动", ko: "탐구 & 체험" },
    "heading.quiz": { zh: "自我测试", ko: "자기 테스트" },
    "heading.toolkit": { zh: "数学工具箱", ko: "수학 도구" },

    /* ── Unit Outline Labels ── */
    "unit.keyconcept": { zh: "核心概念：", ko: "핵심 개념:" },
    "unit.globalcontext": { zh: "全球背景：", ko: "글로벌 맥락:" },
    "unit.past": { zh: "以前的单元", ko: "이전 단원" },
    "unit.back": { zh: "← 返回首页", ko: "← 홈으로" },

    /* ── Quiz UI ── */
    "quiz.intro": { zh: "测试自己！阅读问题，想好答案，然后点击「显示答案」检查。诚实评估你的信心——这有助于你了解需要复习什么。", ko: "스스로 테스트하세요! 질문을 읽고 답을 생각한 다음 '정답 보기'를 클릭하세요." },
    "quiz.show": { zh: "显示答案", ko: "정답 보기" },
    "quiz.shuffle": { zh: "🔀 打乱顺序", ko: "🔀 섞기" },
    "quiz.reset": { zh: "↻ 重置", ko: "↻ 초기화" },
    "quiz.howdid": { zh: "你做得怎样？", ko: "어떻게 했나요?" },
    "quiz.got": { zh: "😊 知道", ko: "😊 알았어요" },
    "quiz.unsure": { zh: "🤔 不确定", ko: "🤔 불확실" },
    "quiz.nope": { zh: "😅 不知道", ko: "😅 몰랐어요" },

    /* ── Explore UI ── */
    "explore.intro": { zh: "本单元的互动模拟和工具。点击「启动」在新标签打开，或「展开」在此使用。", ko: "이 단원의 실습 시뮬레이션과 도구입니다." },
    "explore.expand": { zh: "▶ 在此展开", ko: "▶ 여기서 열기" },
    "explore.fullscreen": { zh: "↗ 全屏", ko: "↗ 전체 화면" },
    "explore.launch": { zh: "↗ 启动", ko: "↗ 열기" },

    /* ── Game UI ── */
    "game.play": { zh: "▶ 在此游玩", ko: "▶ 여기서 플레이" },
    "game.newtab": { zh: "↗ 新标签", ko: "↗ 새 탭" },

    /* ── Glossary ── */
    "glossary.intro.sci": { zh: "本单元的核心词汇。用这些来积累科学词汇。", ko: "이 단원의 핵심 용어입니다. 과학 어휘를 쌓는 데 활용하세요." },
    "glossary.intro.math": { zh: "本单元的核心词汇。用这些来积累数学词汇。", ko: "이 단원의 핵심 용어입니다. 수학 어휘를 쌓는 데 활용하세요." },
  };

  /* ── Glossary Term Translations (Chinese only — primary EAL) ── */
  var termTranslations = {
    /* G6 Science */
    "Crust":"地壳", "Mantle":"地幔", "Outer Core":"外核", "Inner Core":"内核",
    "Oceanic Crust":"大洋地壳", "Continental Crust":"大陆地壳",
    "Convection Current":"对流", "Density":"密度", "Tectonic Plate":"板块",
    "Radioactive Decay":"放射性衰变",
    "Divergent Boundary":"离散边界", "Convergent Boundary":"汇聚边界",
    "Transform Boundary":"转换边界", "Subduction":"俯冲",
    "Sea-Floor Spreading":"海底扩张", "Pangaea":"盘古大陆",
    "Continental Drift":"大陆漂移", "Fossil Evidence":"化石证据",
    "Ring of Fire":"环太平洋火山带", "Earthquake":"地震", "Volcano":"火山",
    /* G6 Maths */
    "Perimeter":"周长", "Circumference":"周长（圆）", "Radius":"半径",
    "Diameter":"直径", "Pi (π)":"圆周率", "Area":"面积",
    "Perpendicular Height":"垂直高度", "Composite Shape":"组合图形",
    "Base":"底边", "Surface Area":"表面积", "Volume":"体积",
    "Cross-Section":"横截面", "Prism":"棱柱", "Net":"展开图",
    "Capacity":"容量",
    /* G7 Science */
    "Force":"力", "Newton (N)":"牛顿", "Contact Force":"接触力",
    "Non-Contact Force":"非接触力", "Weight":"重力", "Mass":"质量",
    "Balanced Forces":"平衡力", "Unbalanced Forces":"非平衡力",
    "Resultant Force":"合力", "Friction":"摩擦力",
    "Air Resistance":"空气阻力", "Terminal Velocity":"终端速度",
    "Streamlined":"流线型",
    "Newton's First Law":"牛顿第一定律", "Newton's Second Law":"牛顿第二定律",
    "Newton's Third Law":"牛顿第三定律", "Inertia":"惯性", "Acceleration":"加速度",
    /* G7 Maths */
    "Variable":"变量", "Term":"项", "Coefficient":"系数", "Constant":"常数",
    "Like Terms":"同类项", "Simplify":"化简", "Equation":"方程",
    "Solve":"解方程", "Inverse Operation":"逆运算", "Balance Method":"平衡法",
    "Function Machine":"函数机", "Common Difference":"公差", "Rule":"规则",
    "Substitution":"代入", "BIDMAS / BODMAS":"运算顺序",
    /* G8 Science */
    "Ecosystem":"生态系统", "Biotic Factor":"生物因素", "Abiotic Factor":"非生物因素",
    "Habitat":"栖息地", "Niche":"生态位",
    "Producer":"生产者", "Consumer":"消费者", "Decomposer":"分解者",
    "Trophic Level":"营养级", "Food Chain":"食物链", "Food Web":"食物网",
    "10% Rule":"10%规则", "Interdependence":"相互依存",
    "Mutualism":"互利共生", "Commensalism":"偏利共生", "Parasitism":"寄生",
    "Trophic Cascade":"营养级联", "Biodiversity":"生物多样性",
    "Invasive Species":"入侵物种", "Deforestation":"森林砍伐",
  };

  var currentLang = localStorage.getItem('mrzocchi-lang') || 'en';

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('mrzocchi-lang', lang);

    // Update toggle buttons
    document.querySelectorAll('.lang-btn').forEach(function(b) {
      b.classList.toggle('lang-btn-active', b.dataset.lang === lang);
    });

    // Translate data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.dataset.i18n;
      var t = translations[key];
      if (lang === 'en') {
        el.textContent = el.dataset.en || el.textContent;
      } else if (t && t[lang]) {
        if (!el.dataset.en) el.dataset.en = el.textContent;
        el.textContent = t[lang];
      }
    });

    // Glossary term translations — show/hide Chinese subtitles
    document.querySelectorAll('.glossary-card').forEach(function(card) {
      var termEl = card.querySelector('.glossary-term');
      if (!termEl) return;
      var term = termEl.dataset.term || termEl.textContent.trim();
      var sub = card.querySelector('.glossary-zh');

      if (lang !== 'en' && termTranslations[term]) {
        if (!sub) {
          sub = document.createElement('span');
          sub.className = 'glossary-zh';
          termEl.parentNode.appendChild(sub);
        }
        sub.textContent = termTranslations[term];
        sub.style.display = '';
      } else if (sub) {
        sub.style.display = 'none';
      }
    });

    // Store term text for lookup
    document.querySelectorAll('.glossary-term').forEach(function(el) {
      if (!el.dataset.term) el.dataset.term = el.textContent.trim();
    });
  }

  // Build and inject language toggle into header
  function init() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var toggle = document.createElement('div');
    toggle.className = 'lang-toggle';
    toggle.innerHTML =
      '<button class="lang-btn" data-lang="en" onclick="window.__setLang(\'en\')"><span class="lang-flag">🇬🇧</span><span class="lang-label">EN</span></button>' +
      '<button class="lang-btn" data-lang="zh" onclick="window.__setLang(\'zh\')"><span class="lang-flag">🇨🇳</span><span class="lang-label">中文</span></button>' +
      '<button class="lang-btn" data-lang="ko" onclick="window.__setLang(\'ko\')"><span class="lang-flag">🇰🇷</span><span class="lang-label">한국어</span></button>';

    // Insert before nav or at end
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
