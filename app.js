(function () {
  const form = document.getElementById('athlete-form');
  const nameInput = document.getElementById('athlete-name');
  const sexInput = document.getElementById('athlete-sex');
  const listEl = document.getElementById('athlete-list');
  const emptyState = document.getElementById('empty-state');
  const errorEl = document.getElementById('form-error');

  const screens = document.querySelectorAll('.screen');
  const navItems = document.querySelectorAll('.nav-item');
  const placeholderTitle = document.getElementById('placeholder-title');
  const placeholderSubtitle = document.getElementById('placeholder-subtitle');
  const placeholderBody = document.getElementById('placeholder-body');
  const placeholderEyebrow = document.getElementById('placeholder-eyebrow');

  const detailScreen = document.getElementById('athlete-detail-screen');
  const detailName = document.getElementById('detail-name');
  const detailSex = document.getElementById('detail-sex');
  const detailPr = document.getElementById('detail-pr');
  const backBtn = document.getElementById('back-to-athletes');
  const viewLogBtn = document.getElementById('view-log');

  let currentAthleteId = null;

  const placeholderContent = {
    log: {
      title: 'Jump log',
      subtitle: 'Jump logging is on the way.',
      body: 'Track attempts, heights, poles, and meet notes right here soon.',
    },
    poles: {
      title: 'Poles',
      subtitle: 'Pole bag planning is coming soon.',
      body: 'Organize poles, labels, and recommendations in one spot.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Set preferences once we add them.',
      body: 'Options for sync, backup, and device preferences will live here.',
    },
    logLink: {
      title: 'Jump log',
      subtitle: 'Logging will be available soon.',
      body: 'This athlete\'s jump log will appear here once the feature is ready.',
    },
  };

  function setActiveScreen(screenId) {
    screens.forEach((screen) => screen.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }
  }

  function setNavActive(targetKey) {
    navItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.target === targetKey);
    });
  }

  function showPlaceholder(type) {
    const content = placeholderContent[type] || placeholderContent.log;
    placeholderEyebrow.textContent = 'Coming soon';
    placeholderTitle.textContent = content.title;
    placeholderSubtitle.textContent = content.subtitle;
    placeholderBody.textContent = content.body;
    setActiveScreen('placeholder-screen');
  }

  function renderAthletes() {
    const athletes = AthleteStore.getAll();
    listEl.innerHTML = '';

    if (!athletes.length) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    athletes
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((athlete) => {
        const item = document.createElement('li');
        item.className = 'athlete-item';
        item.dataset.id = athlete.id;

        const meta = document.createElement('div');
        meta.className = 'athlete-meta';

        const name = document.createElement('p');
        name.className = 'athlete-name';
        name.textContent = athlete.name;

        meta.appendChild(name);

        const sex = document.createElement('p');
        sex.className = 'athlete-note';
        sex.textContent = athlete.sex || 'Not set';
        meta.appendChild(sex);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('aria-label', `Delete ${athlete.name}`);
        deleteBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          AthleteStore.remove(athlete.id);
          renderAthletes();
        });

        item.addEventListener('click', () => openAthleteDetail(athlete.id));

        item.appendChild(meta);
        item.appendChild(deleteBtn);
        listEl.appendChild(item);
      });
  }

  function openAthleteDetail(id) {
    const athlete = AthleteStore.getById(id);
    if (!athlete) return;

    currentAthleteId = id;
    detailName.textContent = athlete.name;
    detailSex.textContent = athlete.sex || 'Not set';
    detailPr.value = athlete.pr || '';
    setNavActive('athletes-screen');
    setActiveScreen('athlete-detail-screen');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const name = nameInput.value;
    const sex = sexInput.value;

    if (!name.trim()) {
      errorEl.textContent = 'Name is required.';
      nameInput.focus();
      return;
    }

    const added = AthleteStore.add({ name, sex });
    if (!added) {
      errorEl.textContent = 'Unable to save athlete. Please try again.';
      return;
    }

    errorEl.textContent = '';
    form.reset();
    nameInput.focus();
    renderAthletes();
  }

  function handlePrChange() {
    if (!currentAthleteId) return;
    AthleteStore.update(currentAthleteId, { pr: detailPr.value });
  }

  function setupNav() {
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (target === 'athletes-screen') {
          setActiveScreen('athletes-screen');
          setNavActive('athletes-screen');
          return;
        }
        setNavActive(target);
        showPlaceholder(target);
      });
    });
  }

  function setupDetailActions() {
    backBtn.addEventListener('click', () => {
      setActiveScreen('athletes-screen');
      setNavActive('athletes-screen');
    });

    viewLogBtn.addEventListener('click', () => {
      setNavActive('log');
      showPlaceholder('logLink');
    });

    detailPr.addEventListener('input', handlePrChange);
  }

  form.addEventListener('submit', handleSubmit);
  setupNav();
  setupDetailActions();
  renderAthletes();
})();
