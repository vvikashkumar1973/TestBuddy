(function () {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const examSelect = document.getElementById('exam-select');
  const examProceed = document.getElementById('exam-proceed');
  const examMeta = document.getElementById('exam-meta');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function () {
      const isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('show');
      } else {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('show');
      }
    });
  }

  // Close mobile menu on navigation
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('show');
      }
    });
  });

  // Load exams from CSV and populate dropdown
  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const parts = line.split(',');
      const examName = parts[0]?.trim();
      const conductingBody = parts.slice(1).join(',').trim();
      if (examName) {
        result.push({ examName, conductingBody });
      }
    }
    return result;
  }

  function populateExams(exams) {
    if (!examSelect) return;
    exams.forEach(function (e) {
      const opt = document.createElement('option');
      opt.value = e.examName;
      opt.textContent = e.examName;
      opt.dataset.conductingBody = e.conductingBody;
      examSelect.appendChild(opt);
    });
  }

  if (examSelect) {
    fetch('assets/data/exams.csv', { cache: 'no-store' })
      .then(function (res) { return res.text(); })
      .then(function (text) { return populateExams(parseCsv(text)); })
      .catch(function () { /* ignore for now */ });

    examSelect.addEventListener('change', function () {
      const selected = examSelect.options[examSelect.selectedIndex];
      const body = selected?.dataset?.conductingBody || '';
      if (examMeta) {
        if (examSelect.value) {
          examMeta.textContent = 'Conducting Body: ' + body;
          examMeta.classList.remove('hidden');
        } else {
          examMeta.textContent = '';
          examMeta.classList.add('hidden');
        }
      }
    });

    if (examProceed) {
      examProceed.addEventListener('click', function () {
        const value = examSelect.value;
        if (!value) {
          examSelect.focus();
          examSelect.classList.add('ring', 'ring-red-400');
          setTimeout(function () { examSelect.classList.remove('ring', 'ring-red-400'); }, 800);
          return;
        }
        var destination = 'Tests.html?exam=' + encodeURIComponent(value);
        var isLoggedIn = localStorage.getItem('tb_logged_in') === 'true';
        if (!isLoggedIn) {
          var redirectUrl = 'Login.html?redirect=' + encodeURIComponent(destination);
          window.location.href = redirectUrl;
        } else {
          window.location.href = destination;
        }
      });
    }
  }

  // ----------------------
  // Tests page rendering
  // ----------------------
  var testsRoot = document.getElementById('tests-root');
  if (testsRoot) {
    var params = new URLSearchParams(window.location.search);
    var selectedExam = params.get('exam') || '';
    var testsExamSelect = document.getElementById('tests-exam-select');

    function getHistoryForExam(examName) {
      try {
        var raw = localStorage.getItem('tb_test_history');
        var parsed = raw ? JSON.parse(raw) : {};
        return parsed[examName] || [];
      } catch (e) {
        return [];
      }
    }

    function setHistoryForExam(examName, history) {
      try {
        var raw = localStorage.getItem('tb_test_history');
        var parsed = raw ? JSON.parse(raw) : {};
        parsed[examName] = history;
        localStorage.setItem('tb_test_history', JSON.stringify(parsed));
      } catch (e) { /* ignore */ }
    }

    function renderKpis(examName) {
      var history = getHistoryForExam(examName);
      var total = history.length;
      var lastScore = total ? history[total - 1].score : 0;
      var sum = history.reduce(function (a, b) { return a + b.score; }, 0);
      var avg = total ? Math.round(sum / total) : 0;
      var sel = document.getElementById('max-marks-select');
      var maxMarks = sel ? parseInt(sel.value, 10) : 100;
      if (isNaN(maxMarks)) maxMarks = 100;
      var totalOutOf = total * maxMarks;
      var html = '' +
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' +
        '  <div class="bg-white border rounded-lg p-6 text-center"><div class="text-sm text-gray-500">Last Score</div><div class="text-3xl font-bold text-gray-900">' + lastScore + '</div></div>' +
        '  <div class="bg-white border rounded-lg p-6 text-center"><div class="text-sm text-gray-500">Average Score</div><div class="text-3xl font-bold text-gray-900">' + avg + '</div></div>' +
        '  <div class="bg-white border rounded-lg p-6 text-center"><div class="text-sm text-gray-500">Total Tests</div><div class="text-3xl font-bold text-gray-900">' + total + '</div></div>' +
        '</div>' +
        '<div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">' +
        '  <div class="bg-white border rounded-lg p-6 text-center"><div class="text-sm text-gray-500">Total Score (All Attempts)</div><div class="text-2xl font-bold text-gray-900">' + sum + ' / ' + (totalOutOf || maxMarks) + '</div></div>' +
        '  <div class="bg-white border rounded-lg p-6 text-center"><div class="text-sm text-gray-500">Max Marks per Test</div><div class="text-2xl font-bold text-gray-900">' + maxMarks + '</div></div>' +
        '</div>';
      var kpis = document.getElementById('tests-kpis');
      if (kpis) kpis.innerHTML = html;
    }

    function simulateTestAttempt(examName, testId) {
      // Generate a mock score based on max marks
      var sel = document.getElementById('max-marks-select');
      var maxMarks = sel ? parseInt(sel.value, 10) : 100;
      if (isNaN(maxMarks)) maxMarks = 100;
      var score = Math.floor(Math.random() * (maxMarks + 1));
      var history = getHistoryForExam(examName);
      history.push({ testId: testId, score: score, ts: Date.now() });
      setHistoryForExam(examName, history);
      renderKpis(examName);
      alert('Test completed. Score: ' + score);
    }

    function createTestCard(item) {
      var card = document.createElement('div');
      card.className = 'bg-gray-50 border rounded-lg p-4 flex items-start justify-between gap-4';
      var left = document.createElement('div');
      left.innerHTML = '<div class="font-semibold text-gray-900">' + item.title + '</div>' +
        (item.subject ? '<div class="text-sm text-gray-600">' + item.subject + '</div>' : '');
      var btn = document.createElement('button');
      btn.className = 'bg-blue-600 text-white px-4 py-2 rounded-md cta-button';
      btn.textContent = 'Start Test';
      btn.addEventListener('click', function () { simulateTestAttempt(selectedExam, item.id); });
      card.appendChild(left);
      card.appendChild(btn);
      return card;
    }

    function populateTests(examName, tests) {
      var fullWrap = document.getElementById('tests-full');
      var subjectsList = document.getElementById('subjects-list');
      var subjectTestsWrap = document.getElementById('subject-tests');
      if (fullWrap) fullWrap.innerHTML = '';
      if (subjectsList) subjectsList.innerHTML = '';
      if (subjectTestsWrap) subjectTestsWrap.innerHTML = '';

      // Full tests
      tests.filter(function (t) { return t.type === 'full'; }).forEach(function (t) {
        if (fullWrap) fullWrap.appendChild(createTestCard(t));
      });

      // Subjects list
      var subjects = Array.from(new Set(tests.filter(function (t) { return t.type === 'subject'; }).map(function (t) { return t.subject || 'Subject'; })));
      subjects.forEach(function (subj) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-full text-left bg-gray-50 border rounded-md px-3 py-2 hover:bg-gray-100';
        btn.textContent = subj;
        btn.addEventListener('click', function () {
          renderSubjectTests(subj, tests, subjectTestsWrap);
        });
        if (subjectsList) subjectsList.appendChild(btn);
      });

      // Default select first subject if available
      if (subjects.length > 0) {
        renderSubjectTests(subjects[0], tests, subjectTestsWrap);
      }

      renderKpis(examName);
    }

    function renderSubjectTests(subject, tests, mount) {
      if (!mount) return;
      mount.innerHTML = '';
      var subjectTests = tests.filter(function (t) { return t.type === 'subject' && (t.subject || '') === subject; });
      subjectTests.forEach(function (t) { mount.appendChild(createTestCard(t)); });
      renderSubjectKpis(subject);
    }

    function renderSubjectKpis(subject) {
      var k = document.getElementById('subject-kpis');
      if (!k) return;
      var history = getHistoryForExam(selectedExam);
      var filtered = history.filter(function (h) { return (h.testId || '').toLowerCase().indexOf(subject.toLowerCase().replace(/\s+/g,'-')) !== -1; });
      var total = filtered.length;
      var sum = filtered.reduce(function (a, b) { return a + b.score; }, 0);
      var avg = total ? Math.round(sum / total) : 0;
      var sel = document.getElementById('max-marks-select');
      var maxMarks = sel ? parseInt(sel.value, 10) : 100;
      if (isNaN(maxMarks)) maxMarks = 100;
      var totalOutOf = total * maxMarks;
      k.innerHTML = '' +
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' +
        '  <div class="bg-white border rounded-lg p-4 text-center"><div class="text-sm text-gray-500">Subject Avg</div><div class="text-2xl font-bold text-gray-900">' + avg + '</div></div>' +
        '  <div class="bg-white border rounded-lg p-4 text-center"><div class="text-sm text-gray-500">Attempts</div><div class="text-2xl font-bold text-gray-900">' + total + '</div></div>' +
        '  <div class="bg-white border rounded-lg p-4 text-center"><div class="text-sm text-gray-500">Subject Total</div><div class="text-2xl font-bold text-gray-900">' + sum + ' / ' + (totalOutOf || maxMarks) + '</div></div>' +
        '</div>';
    }

    function loadTests(examName) {
      if (!examName) return;
      var examLabel = document.getElementById('selected-exam-label');
      if (examLabel) examLabel.textContent = examName;
      if (testsExamSelect && testsExamSelect.value !== examName) {
        testsExamSelect.value = examName;
      }
      fetch('assets/data/tests.json', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (json) {
          var forExam = (json.tests || []).filter(function (t) { return t.exam === examName; });
          if (!forExam || forExam.length === 0) {
            forExam = generateDummyTests(examName);
          }
          populateTests(examName, forExam);
        })
        .catch(function () {
          // On error, show dummy tests so page is still usable
          var fallback = generateDummyTests(examName);
          populateTests(examName, fallback);
        });
    }

    loadTests(selectedExam);

    // Populate tests page exam selector from CSV and sync navigation
    if (testsExamSelect) {
      fetch('assets/data/exams.csv', { cache: 'no-store' })
        .then(function (res) { return res.text(); })
        .then(function (text) {
          var exams = parseCsv(text);
          exams.forEach(function (e) {
            var opt = document.createElement('option');
            opt.value = e.examName;
            opt.textContent = e.examName;
            testsExamSelect.appendChild(opt);
          });
          if (selectedExam) {
            testsExamSelect.value = selectedExam;
          }
        });

      testsExamSelect.addEventListener('change', function () {
        var value = testsExamSelect.value;
        if (value) {
          window.location.href = 'Tests.html?exam=' + encodeURIComponent(value);
        }
      });
    }
  }

  function generateDummyTests(examName) {
    var tests = [];
    for (var i = 1; i <= 20; i++) {
      tests.push({ id: (examName + '-full-' + i).toLowerCase().replace(/\s+/g,'-'), exam: examName, type: 'full', title: 'Mock ' + i });
    }
    var subjects = ['English', 'Reasoning', 'Math', 'GK', 'General Science'];
    subjects.forEach(function (subj) {
      for (var j = 1; j <= 12; j++) {
        tests.push({ id: (examName + '-' + subj + '-' + j).toLowerCase().replace(/\s+/g,'-'), exam: examName, type: 'subject', subject: subj, title: subj + ' Mock ' + j });
      }
    });
    return tests;
  }

  // ----------------------
  // Login page helpers
  // ----------------------
  var loginPage = document.body && document.title && document.title.indexOf('Login') !== -1;
  if (loginPage) {
    try {
      var urlp = new URLSearchParams(window.location.search);
      var redirect = urlp.get('redirect') || 'TestBuddy.html';
      var loginCtas = document.querySelectorAll('#form-login button, #form-signup button');
      loginCtas.forEach(function(btn){
        btn.addEventListener('click', function(){
          localStorage.setItem('tb_logged_in', 'true');
          window.location.href = redirect;
        });
      });
    } catch (e) { /* ignore */ }
  }
})();

