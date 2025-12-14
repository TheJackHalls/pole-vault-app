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

  const logForm = document.getElementById('log-form');
  const logAthleteSelect = document.getElementById('log-athlete');
  const logDateInput = document.getElementById('log-date');
  const logBarInput = document.getElementById('log-bar');
  const logResultInputs = document.querySelectorAll('input[name="log-result"]');
  const logNoteInput = document.getElementById('log-note');
  const logError = document.getElementById('log-error');
  const logList = document.getElementById('jump-log');
  const logEmpty = document.getElementById('jump-log-empty');
  const logFilterSelect = document.getElementById('log-filter');
  const unitModeInputs = document.querySelectorAll('input[name="settings-units"]');
  const barHelper = document.getElementById('bar-helper');

  let currentAthleteId = null;

  const placeholderContent = {
    poles: {
      title: 'Poles',
      subtitle: 'Pole bag planning is coming soon.',
      body: 'Organize poles, labels, and recommendations in one spot.',
    },
  };

  function getUnitMode() {
    return SettingsStore.getUnitMode();
  }

  function updateBarPlaceholder() {
    const unitMode = getUnitMode();
    if (!logBarInput || !barHelper) return;
    if (unitMode === 'metric') {
      logBarInput.placeholder = 'e.g., 3.50 m';
      barHelper.textContent = 'Metric: meters or centimeters (e.g., 3.50 m or 350 cm)';
      return;
    }
    logBarInput.placeholder = "e.g., 11' 6\"";
    barHelper.textContent = 'Imperial: feet and inches (e.g., 11\' 6\" or 11-6)';
  }

  function setUnitSelection(mode) {
    unitModeInputs.forEach((input) => {
      input.checked = input.value === mode;
    });
    updateBarPlaceholder();
    renderJumpLog();
  }

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
    const content = placeholderContent[type] || placeholderContent.settings;
    placeholderEyebrow.textContent = 'Coming soon';
    placeholderTitle.textContent = content.title;
    placeholderSubtitle.textContent = content.subtitle;
    placeholderBody.textContent = content.body;
    setActiveScreen('placeholder-screen');
  }

  function populateAthleteSelect(selectEl, { includeAll = false, selectedId = null } = {}) {
    const athletes = AthleteStore.getAll().slice().sort((a, b) => a.name.localeCompare(b.name));
    const currentValue = selectedId ?? selectEl.value;
    selectEl.innerHTML = '';

    if (includeAll) {
      const option = document.createElement('option');
      option.value = 'all';
      option.textContent = 'All athletes';
      selectEl.appendChild(option);
    }

    athletes.forEach((athlete) => {
      const option = document.createElement('option');
      option.value = athlete.id;
      option.textContent = athlete.name;
      selectEl.appendChild(option);
    });

    if (currentValue && Array.from(selectEl.options).some((opt) => opt.value === currentValue)) {
      selectEl.value = currentValue;
    }
  }

  function refreshAthleteSelectors() {
    populateAthleteSelect(logAthleteSelect);
    populateAthleteSelect(logFilterSelect, { includeAll: true, selectedId: logFilterSelect.value || 'all' });
  }

  function renderAthletes() {
    const athletes = AthleteStore.getAll();
    listEl.innerHTML = '';

    if (!athletes.length) {
      emptyState.style.display = 'block';
      refreshAthleteSelectors();
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
          renderJumpLog();
        });

        item.addEventListener('click', () => openAthleteDetail(athlete.id));

        item.appendChild(meta);
        item.appendChild(deleteBtn);
        listEl.appendChild(item);
      });

    refreshAthleteSelectors();
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

  function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    if (logDateInput) {
      logDateInput.value = today;
    }
  }

  function getSelectedResult() {
    const selected = Array.from(logResultInputs).find((input) => input.checked);
    return selected ? selected.value : null;
  }

  function getAthleteNameMap() {
    return AthleteStore.getAll().reduce((acc, athlete) => {
      acc[athlete.id] = athlete.name;
      return acc;
    }, {});
  }

  function parseImperialBar(raw) {
    const normalized = raw
      .trim()
      .toLowerCase()
      .replace(/feet|foot|ft/g, "'")
      .replace(/inches|inch|in/g, '"')
      .replace(/[’]/g, "'")
      .replace(/[”″]/g, '"');

    const explicit = normalized.match(/(\d+(?:\.\d+)?)\s*'\s*(\d+(?:\.\d+)?)/);
    let feet;
    let inches;

    if (explicit) {
      feet = parseFloat(explicit[1]);
      inches = parseFloat(explicit[2]);
    } else {
      const tokens = normalized.split(/[^0-9.]+/).filter(Boolean);
      if (tokens.length >= 2) {
        feet = parseFloat(tokens[0]);
        inches = parseFloat(tokens[1]);
      }
    }

    if (!Number.isFinite(feet) || !Number.isFinite(inches)) return null;

    return (feet * 12 + inches) * 2.54;
  }

  function parseMetricBar(raw) {
    const normalized = raw.trim().toLowerCase();
    const numberMatch = normalized.match(/-?\d*\.?\d+/);
    if (!numberMatch) return null;
    const value = parseFloat(numberMatch[0]);
    if (!Number.isFinite(value)) return null;

    const hasCm = normalized.includes('cm');
    const hasM = normalized.includes('m');

    if (hasCm || (!hasM && value >= 10)) {
      return value;
    }

    return value * 100;
  }

  function parseBarHeight(raw, unitMode) {
    if (!raw.trim()) return null;
    if (unitMode === 'metric') return parseMetricBar(raw);
    return parseImperialBar(raw);
  }

  function formatBarForDisplay(jump) {
    const unitMode = getUnitMode();
    if (Number.isFinite(jump.barValueCm)) {
      if (unitMode === 'metric') {
        const meters = jump.barValueCm / 100;
        return `${meters.toFixed(2)} m`;
      }

      const totalInches = jump.barValueCm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches - feet * 12;
      const roundedInches = Math.round(inches * 4) / 4;
      const inchLabel = Number.isInteger(roundedInches)
        ? `${roundedInches}`
        : `${roundedInches.toFixed(2)}`;
      return `${feet}' ${inchLabel}"`;
    }

    return jump.barRaw || jump.bar || '—';
  }

  function renderJumpLog() {
    const filterId = logFilterSelect.value || 'all';
    const allJumps = filterId === 'all' ? JumpStore.getAll() : JumpStore.getByAthlete(filterId);
    const athletesById = getAthleteNameMap();

    const sorted = allJumps
      .slice()
      .sort((a, b) => {
        if (a.date === b.date) return b.createdAt - a.createdAt;
        return a.date < b.date ? 1 : -1;
      });

    const byDate = sorted.reduce((groups, jump) => {
      groups[jump.date] = groups[jump.date] || [];
      groups[jump.date].push(jump);
      return groups;
    }, {});

    logList.innerHTML = '';

    const dates = Object.keys(byDate).sort((a, b) => (a < b ? 1 : -1));

    if (!dates.length) {
      logEmpty.style.display = 'block';
      return;
    }

    logEmpty.style.display = 'none';

    dates.forEach((date) => {
      const section = document.createElement('section');
      section.className = 'log-day';

      const header = document.createElement('header');
      const title = document.createElement('h3');
      title.textContent = new Date(date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const count = document.createElement('p');
      count.className = 'subtitle';
      count.textContent = `${byDate[date].length} jump${byDate[date].length === 1 ? '' : 's'}`;
      header.appendChild(title);
      header.appendChild(count);
      section.appendChild(header);

      const list = document.createElement('ul');

      byDate[date].forEach((jump) => {
        const item = document.createElement('li');
        item.className = 'log-entry';

        const meta = document.createElement('div');
        meta.className = 'meta';

        const heading = document.createElement('p');
        heading.className = 'title';
        const athleteName = athletesById[jump.athleteId] || 'Unknown athlete';
        heading.textContent = `${athleteName} · ${formatBarForDisplay(jump)}`;

        const note = document.createElement('p');
        note.className = 'note';
        note.textContent = jump.note || '—';

        meta.appendChild(heading);
        meta.appendChild(note);

        const badge = document.createElement('span');
        const isMake = jump.result === 'make';
        badge.className = `result-badge ${isMake ? 'result-make' : 'result-miss'}`;
        badge.textContent = isMake ? 'Make' : 'Miss';

        const actions = document.createElement('div');
        actions.className = 'log-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'log-delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('aria-label', `Delete jump for ${athleteName}`);
        deleteBtn.addEventListener('click', () => {
          const confirmed = window.confirm(`Delete this jump for ${athleteName}?`);
          if (!confirmed) return;
          JumpStore.remove(jump.id);
          renderJumpLog();
        });

        actions.appendChild(deleteBtn);
        actions.appendChild(badge);

        item.appendChild(meta);
        item.appendChild(actions);
        list.appendChild(item);
      });

      section.appendChild(list);
      logList.appendChild(section);
    });
  }

  function handleLogSubmit(event) {
    event.preventDefault();
    const athleteId = logAthleteSelect.value;
    const date = logDateInput.value;
    const barRaw = logBarInput.value;
    const result = getSelectedResult();
    const note = logNoteInput.value;
    const unitMode = getUnitMode();
    const barValueCm = parseBarHeight(barRaw, unitMode);

    if (!athleteId) {
      logError.textContent = 'Choose an athlete to log a jump.';
      logAthleteSelect.focus();
      return;
    }

    if (!date) {
      logError.textContent = 'Pick a date for the jump.';
      logDateInput.focus();
      return;
    }

    if (!barRaw.trim()) {
      logError.textContent = 'Enter the bar height hit or attempted.';
      logBarInput.focus();
      return;
    }

    const saved = JumpStore.add({
      athleteId,
      date,
      barRaw,
      barValueCm,
      barUnitMode: unitMode,
      result,
      note,
    });
    if (!saved) {
      logError.textContent = 'Unable to save jump. Please try again.';
      return;
    }

    logError.textContent = '';
    logForm.reset();
    setDefaultDate();
    populateAthleteSelect(logAthleteSelect, { selectedId: athleteId });
    logFilterSelect.value = athleteId;
    renderJumpLog();
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

        if (target === 'log') {
          setActiveScreen('log-screen');
          setNavActive('log');
          renderJumpLog();
          return;
        }

        if (target === 'settings') {
          setActiveScreen('settings-screen');
          setNavActive('settings');
          return;
        }

        setNavActive(target);
        showPlaceholder(target);
      });
    });
  }

  function setupSettings() {
    const savedMode = getUnitMode();
    setUnitSelection(savedMode);

    unitModeInputs.forEach((input) => {
      input.addEventListener('change', (event) => {
        setUnitSelection(event.target.value);
      });
    });
  }

  function setupDetailActions() {
    backBtn.addEventListener('click', () => {
      setActiveScreen('athletes-screen');
      setNavActive('athletes-screen');
    });

    viewLogBtn.addEventListener('click', () => {
      if (!currentAthleteId) return;
      setNavActive('log');
      setActiveScreen('log-screen');
      refreshAthleteSelectors();
      populateAthleteSelect(logAthleteSelect, { selectedId: currentAthleteId });
      logFilterSelect.value = currentAthleteId;
      renderJumpLog();
    });

    detailPr.addEventListener('input', handlePrChange);
  }

  function setupLogActions() {
    logForm.addEventListener('submit', handleLogSubmit);
    logFilterSelect.addEventListener('change', renderJumpLog);
  }

  setupSettings();
  form.addEventListener('submit', handleSubmit);
  setupNav();
  setupDetailActions();
  setupLogActions();
  setDefaultDate();
  refreshAthleteSelectors();
  renderAthletes();
  renderJumpLog();
})();
