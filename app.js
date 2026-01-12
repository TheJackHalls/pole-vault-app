(() => {
  const app = document.getElementById('app');
  const STORAGE_KEY = 'poleVaultData_v2';
  const SETTINGS_KEY = 'taykof_settings_v2';

  const defaultSettings = {
    appearance: 'light',
    units: 'imperial',
    stepsMode: 'leftsRights',
    enableSteps: true,
    enableApproachDistance: false,
    enableCoachMark: false,
    enableTakeoffStep: false,
    enablePoleSelection: false,
    enableGripHeight: false,
    enableStandards: false,
    enableLanding: false,
    enablePoleBend: false,
    enableNotes: true,
    poleFields: {
      brand: true,
      flex: false,
      nickname: false,
    },
  };

  const state = {
    view: 'athletes',
    athleteId: null,
    reviewAthleteId: null,
    logMode: 'practice',
    attempt: 1,
    practiceBarUp: true,
    lastHeightCm: null,
  };

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { athletes: [], jumps: [], poles: [] };
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        athletes: parsed.athletes || [],
        jumps: parsed.jumps || [],
        poles: parsed.poles || [],
      };
    } catch (error) {
      console.error('Failed to parse data', error);
      return { athletes: [], jumps: [], poles: [] };
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getSettings() {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    try {
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch (error) {
      console.error('Failed to parse settings', error);
      return defaultSettings;
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  function toCmFromImperial(feet, inches) {
    const totalInches = (Number(feet) || 0) * 12 + (Number(inches) || 0);
    return totalInches * 2.54;
  }

  function toCmFromMetric(meters) {
    return (Number(meters) || 0) * 100;
  }

  function fromCmToImperial(cm) {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Number((totalInches - feet * 12).toFixed(2));
    return { feet, inches };
  }

  function fromCmToMetric(cm) {
    return Number((cm / 100).toFixed(2));
  }

  function formatHeight(cm, unit) {
    if (!cm && cm !== 0) return '—';
    if (unit === 'metric') {
      return `${fromCmToMetric(cm)} m`;
    }
    const { feet, inches } = fromCmToImperial(cm);
    return `${feet}' ${inches.toFixed(2).replace(/\.00$/, '')}"`;
  }

  function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderHeader(title) {
    const header = createElement('header', 'top-header');
    const wordmark = createElement('div', 'wordmark', 'TAYKOF');
    const screenTitle = createElement('div', 'screen-title', title);
    header.append(wordmark, screenTitle);
    return header;
  }

  function renderBottomNav() {
    const nav = createElement('nav', 'bottom-nav');
    const items = [
      { id: 'athletes', label: 'Athletes' },
      { id: 'log', label: 'Log' },
      { id: 'poles', label: 'Poles' },
      { id: 'settings', label: 'Settings' },
    ];
    items.forEach(item => {
      const btn = createElement('button', state.view === item.id ? 'nav-button active' : 'nav-button', item.label);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        state.view = item.id;
        if (item.id === 'log') {
          const athletes = loadData().athletes;
          if (athletes.length && !state.athleteId) state.athleteId = athletes[0].id;
        }
        render();
      });
      nav.appendChild(btn);
    });
    return nav;
  }

  function getAthletesSorted() {
    const { athletes } = loadData();
    return athletes.slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  function getAthleteById(id) {
    return loadData().athletes.find(athlete => athlete.id === id) || null;
  }

  function getJumpsForAthlete(athleteId) {
    const { jumps } = loadData();
    return jumps
      .filter(jump => jump.athleteId === athleteId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  function addAthlete(name, sex) {
    const data = loadData();
    const athlete = { id: uuid(), name: name.trim(), sex, prCm: null };
    data.athletes.push(athlete);
    saveData(data);
  }

  function updateAthlete(updated) {
    const data = loadData();
    data.athletes = data.athletes.map(a => (a.id === updated.id ? updated : a));
    saveData(data);
  }

  function deleteAthlete(id) {
    const data = loadData();
    data.athletes = data.athletes.filter(a => a.id !== id);
    data.jumps = data.jumps.filter(j => j.athleteId !== id);
    saveData(data);
  }

  function addJump(jump) {
    const data = loadData();
    data.jumps.push({ id: uuid(), createdAt: new Date().toISOString(), ...jump });
    saveData(data);
  }

  function addPole(pole) {
    const data = loadData();
    data.poles.push({ id: uuid(), ...pole });
    saveData(data);
  }

  function updatePole(updated) {
    const data = loadData();
    data.poles = data.poles.map(p => (p.id === updated.id ? updated : p));
    saveData(data);
  }

  function deletePole(id) {
    const data = loadData();
    data.poles = data.poles.filter(p => p.id !== id);
    saveData(data);
  }

  function exportData() {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  function renderAthletes() {
    const screen = createElement('section', 'screen');
    screen.appendChild(renderHeader('Athletes'));

    const athletesList = createElement('div', 'card');
    const listTitle = createElement('div', 'section-title', 'Saved Athletes');
    const list = createElement('ul', 'list');
    const athletes = getAthletesSorted();
    if (!athletes.length) {
      list.appendChild(createElement('li', 'list-empty', 'No athletes yet.'));
    } else {
      athletes.forEach(athlete => {
        const item = createElement('li', 'list-item');
        const info = createElement('div', 'list-info');
        info.appendChild(createElement('div', 'list-name', athlete.name));
        info.appendChild(createElement('div', 'list-meta', athlete.sex === 'male' ? 'Male' : 'Female'));
        const actions = createElement('div', 'list-actions');
        const viewBtn = createElement('button', 'ghost-button', 'View');
        viewBtn.addEventListener('click', () => {
          state.view = 'athleteDetail';
          state.athleteId = athlete.id;
          render();
        });
        const deleteBtn = createElement('button', 'ghost-button danger', 'Delete');
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Delete ${athlete.name}?`)) {
            deleteAthlete(athlete.id);
            render();
          }
        });
        actions.append(viewBtn, deleteBtn);
        item.append(info, actions);
        list.appendChild(item);
      });
    }
    athletesList.append(listTitle, list);

    const addCard = createElement('div', 'card');
    addCard.appendChild(createElement('div', 'section-title', 'Add Athlete'));
    const form = createElement('form');
    const nameLabel = createElement('label');
    nameLabel.textContent = 'Name';
    const nameInput = createElement('input');
    nameInput.type = 'text';
    nameInput.required = true;
    nameInput.placeholder = 'First Last';

    const sexLabel = createElement('label');
    sexLabel.textContent = 'Sex';
    const sexSelect = createElement('select');
    ['male', 'female'].forEach(value => {
      const option = createElement('option');
      option.value = value;
      option.textContent = value === 'male' ? 'Male' : 'Female';
      sexSelect.appendChild(option);
    });

    const submit = createElement('button', 'primary-button', 'Add Athlete');
    submit.type = 'submit';

    form.append(nameLabel, nameInput, sexLabel, sexSelect, submit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!nameInput.value.trim()) return;
      addAthlete(nameInput.value, sexSelect.value);
      nameInput.value = '';
      render();
    });

    addCard.appendChild(form);

    screen.append(athletesList, addCard);
    screen.appendChild(renderBottomNav());
    return screen;
  }

  function renderAthleteDetail() {
    const athlete = getAthleteById(state.athleteId);
    const screen = createElement('section', 'screen');
    screen.appendChild(renderHeader('Athlete'));
    if (!athlete) {
      const empty = createElement('div', 'card');
      empty.textContent = 'Athlete not found.';
      screen.append(empty, renderBottomNav());
      return screen;
    }

    const infoCard = createElement('div', 'card');
    const infoRow = createElement('div', 'detail-header');
    infoRow.appendChild(createElement('div', 'detail-name', athlete.name));
    const editBtn = createElement('button', 'icon-button', '✎');
    editBtn.title = 'Edit athlete';
    infoRow.appendChild(editBtn);
    infoCard.appendChild(infoRow);
    infoCard.appendChild(createElement('div', 'detail-meta', athlete.sex === 'male' ? 'Male' : 'Female'));

    const editForm = createElement('form', 'hidden');
    const editName = createElement('input');
    editName.type = 'text';
    editName.value = athlete.name;
    const editSex = createElement('select');
    ['male', 'female'].forEach(value => {
      const option = createElement('option');
      option.value = value;
      option.textContent = value === 'male' ? 'Male' : 'Female';
      if (athlete.sex === value) option.selected = true;
      editSex.appendChild(option);
    });
    const saveBtn = createElement('button', 'primary-button', 'Save');
    saveBtn.type = 'submit';
    editForm.append(editName, editSex, saveBtn);
    editForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!editName.value.trim()) return;
      updateAthlete({ ...athlete, name: editName.value.trim(), sex: editSex.value });
      render();
    });

    editBtn.addEventListener('click', () => {
      editForm.classList.toggle('hidden');
    });

    infoCard.appendChild(editForm);

    const settings = getSettings();
    const prCard = createElement('div', 'card');
    const prHeader = createElement('div', 'card-header');
    prHeader.appendChild(createElement('div', 'section-title', 'Personal Record'));
    const prEditBtn = createElement('button', 'icon-button', '✎');
    prEditBtn.title = 'Edit PR';
    prHeader.appendChild(prEditBtn);
    prCard.appendChild(prHeader);

    const prDisplay = createElement('div', 'pr-display', formatHeight(athlete.prCm, settings.units));
    prCard.appendChild(prDisplay);

    const prForm = createElement('form', 'hidden');
    const prInputs = createElement('div', 'field-row');
    let prFeet = null;
    let prInches = null;
    let prMeters = null;
    if (settings.units === 'imperial') {
      prFeet = createElement('input');
      prFeet.type = 'number';
      prFeet.inputMode = 'numeric';
      prFeet.placeholder = 'Feet';
      prInches = createElement('input');
      prInches.type = 'number';
      prInches.inputMode = 'decimal';
      prInches.placeholder = 'Inches';
      if (athlete.prCm) {
        const { feet, inches } = fromCmToImperial(athlete.prCm);
        prFeet.value = feet;
        prInches.value = inches;
      }
      prInputs.append(prFeet, prInches);
    } else {
      prMeters = createElement('input');
      prMeters.type = 'number';
      prMeters.step = '0.01';
      prMeters.inputMode = 'decimal';
      prMeters.placeholder = 'Meters';
      if (athlete.prCm) prMeters.value = fromCmToMetric(athlete.prCm);
      prInputs.append(prMeters);
    }
    const prSave = createElement('button', 'primary-button', 'Save PR');
    prSave.type = 'submit';
    prForm.append(prInputs, prSave);

    prForm.addEventListener('submit', event => {
      event.preventDefault();
      let prCm = athlete.prCm;
      if (settings.units === 'imperial') {
        prCm = toCmFromImperial(prFeet.value, prInches.value);
      } else {
        prCm = toCmFromMetric(prMeters.value);
      }
      updateAthlete({ ...athlete, prCm });
      render();
    });

    prEditBtn.addEventListener('click', () => {
      prForm.classList.toggle('hidden');
    });

    prCard.appendChild(prForm);

    const jumps = getJumpsForAthlete(athlete.id);
    const recentCard = createElement('div', 'card');
    recentCard.appendChild(createElement('div', 'section-title', 'Recent Jumps'));
    const recentList = createElement('ul', 'list');
    jumps.slice(0, 4).forEach(jump => {
      const item = createElement('li', 'list-item');
      const info = createElement('div', 'list-info');
      const label = jump.mode === 'competition' ? 'Competition' : 'Practice';
      info.appendChild(createElement('div', 'list-name', `${label} — ${formatHeight(jump.heightCm, settings.units)}`));
      info.appendChild(createElement('div', 'list-meta', new Date(jump.createdAt).toLocaleString()));
      item.appendChild(info);
      recentList.appendChild(item);
    });
    if (!jumps.length) {
      recentList.appendChild(createElement('li', 'list-empty', 'No jumps logged yet.'));
    }
    const seeAll = createElement('button', 'secondary-button', 'See All Jumps');
    seeAll.type = 'button';
    seeAll.addEventListener('click', () => {
      state.view = 'review';
      state.reviewAthleteId = athlete.id;
      render();
    });
    recentCard.append(recentList, seeAll);

    screen.append(infoCard, prCard, recentCard, renderBottomNav());
    return screen;
  }

  function getLastJumpForAthlete(athleteId) {
    const jumps = getJumpsForAthlete(athleteId);
    return jumps[0] || null;
  }

  function renderLog() {
    const screen = createElement('section', 'screen');
    screen.appendChild(renderHeader('Log'));

    const data = loadData();
    const settings = getSettings();
    const athletes = getAthletesSorted();

    const card = createElement('div', 'card');
    const headerRow = createElement('div', 'card-header');
    headerRow.appendChild(createElement('div', 'section-title', 'Add Jump'));
    const reviewBtn = createElement('button', 'secondary-button small', 'See Jump Log');
    reviewBtn.type = 'button';
    reviewBtn.addEventListener('click', () => {
      state.view = 'review';
      state.reviewAthleteId = state.athleteId || (athletes[0] && athletes[0].id);
      render();
    });
    headerRow.appendChild(reviewBtn);
    card.appendChild(headerRow);

    if (!athletes.length) {
      card.appendChild(createElement('div', 'empty-state', 'Add an athlete before logging jumps.'));
      screen.append(card, renderBottomNav());
      return screen;
    }

    const form = createElement('form');

    const filterRow = createElement('div', 'filter-row');
    const filters = ['all', 'male', 'female'];
    let currentFilter = 'all';
    filters.forEach(filter => {
      const btn = createElement('button', filter === 'all' ? 'pill-button selected' : 'pill-button',
        filter === 'all' ? 'All' : filter === 'male' ? 'Male' : 'Female');
      btn.type = 'button';
      btn.addEventListener('click', () => {
        currentFilter = filter;
        render();
      });
      btn.dataset.filter = filter;
      filterRow.appendChild(btn);
    });

    const athleteLabel = createElement('label');
    athleteLabel.textContent = 'Athlete';
    const athleteSelect = createElement('select');
    const filteredAthletes = athletes.filter(a => currentFilter === 'all' || a.sex === currentFilter);
    filteredAthletes.forEach(athlete => {
      const option = createElement('option');
      option.value = athlete.id;
      option.textContent = athlete.name;
      athleteSelect.appendChild(option);
    });
    if (!filteredAthletes.length) {
      const option = createElement('option');
      option.value = '';
      option.textContent = 'No athletes in filter';
      athleteSelect.appendChild(option);
    }
    athleteSelect.value = state.athleteId || filteredAthletes[0].id;
    state.athleteId = athleteSelect.value;
    athleteSelect.addEventListener('change', event => {
      state.athleteId = event.target.value;
      const lastJump = getLastJumpForAthlete(state.athleteId);
      if (lastJump) {
        state.logMode = lastJump.mode;
        state.attempt = lastJump.attempt || 1;
        state.practiceBarUp = lastJump.barUp !== false;
        state.lastHeightCm = lastJump.heightCm || null;
      }
      render();
    });

    const modeLabel = createElement('label');
    modeLabel.textContent = 'Session Type';
    const modeRow = createElement('div', 'option-row');
    const practiceBtn = createElement('button', state.logMode === 'practice' ? 'option-button selected' : 'option-button', 'Practice');
    const competitionBtn = createElement('button', state.logMode === 'competition' ? 'option-button selected' : 'option-button', 'Competition');
    practiceBtn.type = 'button';
    competitionBtn.type = 'button';
    practiceBtn.addEventListener('click', () => {
      state.logMode = 'practice';
      render();
    });
    competitionBtn.addEventListener('click', () => {
      state.logMode = 'competition';
      render();
    });
    modeRow.append(practiceBtn, competitionBtn);

    const barUpLabel = createElement('label');
    barUpLabel.textContent = 'Bar Up?';
    const barUpRow = createElement('div', 'option-row');
    const barUpYes = createElement('button', state.practiceBarUp ? 'option-button selected' : 'option-button', 'Yes');
    const barUpNo = createElement('button', !state.practiceBarUp ? 'option-button selected' : 'option-button', 'No');
    barUpYes.type = 'button';
    barUpNo.type = 'button';
    barUpYes.addEventListener('click', () => {
      state.practiceBarUp = true;
      render();
    });
    barUpNo.addEventListener('click', () => {
      state.practiceBarUp = false;
      render();
    });
    barUpRow.append(barUpYes, barUpNo);

    const heightLabel = createElement('label');
    heightLabel.textContent = 'Bar Height';
    const heightRow = createElement('div', 'field-row');
    const heightFeet = createElement('input');
    const heightInches = createElement('input');
    const heightMeters = createElement('input');
    let heightCm = state.lastHeightCm;

    if (settings.units === 'imperial') {
      heightFeet.type = 'number';
      heightFeet.inputMode = 'numeric';
      heightFeet.placeholder = 'Feet';
      heightInches.type = 'number';
      heightInches.step = '0.01';
      heightInches.inputMode = 'decimal';
      heightInches.placeholder = 'Inches';
      if (heightCm) {
        const { feet, inches } = fromCmToImperial(heightCm);
        heightFeet.value = feet;
        heightInches.value = inches;
      }
      heightRow.append(heightFeet, heightInches);
    } else {
      heightMeters.type = 'number';
      heightMeters.step = '0.01';
      heightMeters.inputMode = 'decimal';
      heightMeters.placeholder = 'Meters';
      if (heightCm) heightMeters.value = fromCmToMetric(heightCm);
      heightRow.append(heightMeters);
    }

    const attemptLabel = createElement('label');
    attemptLabel.textContent = 'Attempt';
    const attemptRow = createElement('div', 'option-row');
    [1, 2, 3].forEach(value => {
      const btn = createElement('button', value === state.attempt ? 'option-button selected' : 'option-button', String(value));
      btn.type = 'button';
      btn.addEventListener('click', () => {
        state.attempt = value;
        render();
      });
      attemptRow.appendChild(btn);
    });

    const resultLabel = createElement('label');
    resultLabel.textContent = 'Result';
    const resultRow = createElement('div', 'option-row');
    const makeBtn = createElement('button', 'option-button', 'Make');
    const missBtn = createElement('button', 'option-button', 'Miss');
    makeBtn.type = 'button';
    missBtn.type = 'button';
    resultRow.append(makeBtn, missBtn);

    let selectedResult = null;
    const selectResult = (result) => {
      selectedResult = result;
      makeBtn.classList.toggle('selected', result === 'make');
      missBtn.classList.toggle('selected', result === 'miss');
    };
    makeBtn.addEventListener('click', () => selectResult('make'));
    missBtn.addEventListener('click', () => selectResult('miss'));

    const optionalFields = createElement('div', 'optional-fields');
    const optionalValues = {};

    if (settings.enableSteps) {
      const stepsLabel = createElement('label');
      stepsLabel.textContent = settings.stepsMode === 'steps' ? 'Steps' : 'Lefts/Rights';
      const stepsSelect = createElement('select');
      const max = settings.stepsMode === 'steps' ? 20 : 10;
      for (let i = 1; i <= max; i += 1) {
        const option = createElement('option');
        option.value = i;
        option.textContent = String(i);
        stepsSelect.appendChild(option);
      }
      optionalFields.append(stepsLabel, stepsSelect);
      optionalValues.steps = stepsSelect;
    }

    if (settings.enableApproachDistance) {
      const label = createElement('label');
      label.textContent = 'Approach Distance';
      const row = createElement('div', 'field-row');
      const feet = createElement('input');
      const inches = createElement('select');
      for (let i = 1; i <= 12; i += 1) {
        const option = createElement('option');
        option.value = i;
        option.textContent = `${i}"`;
        inches.appendChild(option);
      }
      feet.type = 'number';
      feet.inputMode = 'numeric';
      feet.placeholder = 'Feet';
      row.append(feet, inches);
      optionalFields.append(label, row);
      optionalValues.approach = { feet, inches };
    }

    if (settings.enableCoachMark) {
      const label = createElement('label');
      label.textContent = 'Coach\'s Mark';
      const row = createElement('div', 'field-row');
      const feet = createElement('input');
      const inches = createElement('select');
      for (let i = 1; i <= 12; i += 1) {
        const option = createElement('option');
        option.value = i;
        option.textContent = `${i}"`;
        inches.appendChild(option);
      }
      feet.type = 'number';
      feet.inputMode = 'numeric';
      feet.placeholder = 'Feet';
      row.append(feet, inches);
      optionalFields.append(label, row);
      optionalValues.coachMark = { feet, inches };
    }

    if (settings.enableTakeoffStep) {
      const label = createElement('label');
      label.textContent = 'Takeoff Step';
      const row = createElement('div', 'field-row');
      const feet = createElement('input');
      const inches = createElement('select');
      for (let i = 1; i <= 12; i += 1) {
        const option = createElement('option');
        option.value = i;
        option.textContent = `${i}"`;
        inches.appendChild(option);
      }
      feet.type = 'number';
      feet.inputMode = 'numeric';
      feet.placeholder = 'Feet';
      row.append(feet, inches);
      optionalFields.append(label, row);
      optionalValues.takeoff = { feet, inches };
    }

    if (settings.enablePoleSelection) {
      const label = createElement('label');
      label.textContent = 'Pole Selection';
      const select = createElement('select');
      const addOption = createElement('option');
      addOption.value = '';
      addOption.textContent = 'Add new pole';
      select.appendChild(addOption);
      data.poles
        .slice()
        .sort((a, b) => a.length - b.length || a.weight - b.weight)
        .forEach(pole => {
          const option = createElement('option');
          option.value = pole.id;
          option.textContent = `${pole.length} / ${pole.weight}${pole.nickname ? ` (${pole.nickname})` : ''}`;
          select.appendChild(option);
        });
      optionalFields.append(label, select);
      optionalValues.poleId = select;
    }

    if (settings.enableGripHeight) {
      const label = createElement('label');
      label.textContent = 'Grip Height';
      const row = createElement('div', 'field-row');
      const feet = createElement('input');
      const inches = createElement('select');
      for (let i = 1; i <= 12; i += 1) {
        const option = createElement('option');
        option.value = i;
        option.textContent = `${i}"`;
        inches.appendChild(option);
      }
      feet.type = 'number';
      feet.inputMode = 'numeric';
      feet.placeholder = 'Feet';
      row.append(feet, inches);
      optionalFields.append(label, row);
      optionalValues.grip = { feet, inches };
    }

    if (settings.enableStandards) {
      const label = createElement('label');
      label.textContent = 'Standards';
      const select = createElement('select');
      if (settings.units === 'metric') {
        for (let i = 40; i <= 80; i += 5) {
          const option = createElement('option');
          option.value = i;
          option.textContent = `${i} cm`;
          select.appendChild(option);
        }
      } else {
        for (let i = 18; i <= 31; i += 1) {
          const option = createElement('option');
          option.value = i;
          option.textContent = `${i}"`;
          select.appendChild(option);
        }
        const option = createElement('option');
        option.value = 31.5;
        option.textContent = '31.5"';
        select.appendChild(option);
      }
      optionalFields.append(label, select);
      optionalValues.standards = select;
    }

    if (settings.enableLanding) {
      const label = createElement('label');
      label.textContent = 'Landing';
      const row = createElement('div', 'option-row');
      ['Shallow', 'Centered', 'Deep'].forEach(value => {
        const btn = createElement('button', 'option-button', value);
        btn.type = 'button';
        btn.addEventListener('click', () => {
          optionalValues.landing = value;
          [...row.children].forEach(child => child.classList.toggle('selected', child.textContent === value));
        });
        row.appendChild(btn);
      });
      optionalFields.append(label, row);
    }

    if (settings.enablePoleBend) {
      const label = createElement('label');
      label.textContent = 'Pole Bend';
      const row = createElement('div', 'option-row');
      ['Too much', 'Just right', 'Too little'].forEach(value => {
        const btn = createElement('button', 'option-button', value);
        btn.type = 'button';
        btn.addEventListener('click', () => {
          optionalValues.poleBend = value;
          [...row.children].forEach(child => child.classList.toggle('selected', child.textContent === value));
        });
        row.appendChild(btn);
      });
      optionalFields.append(label, row);
    }

    if (settings.enableNotes) {
      const label = createElement('label');
      label.textContent = 'Notes';
      const notes = createElement('textarea');
      optionalFields.append(label, notes);
      optionalValues.notes = notes;
    }

    const submit = createElement('button', 'primary-button', 'Add Jump');
    submit.type = 'submit';

    form.append(filterRow, athleteLabel, athleteSelect, modeLabel, modeRow);
    if (state.logMode === 'practice') {
      form.append(barUpLabel, barUpRow);
    }
    if (state.logMode === 'competition' || state.practiceBarUp) {
      form.append(heightLabel, heightRow, resultLabel, resultRow);
    }
    if (state.logMode === 'competition') {
      form.append(attemptLabel, attemptRow);
    }
    form.append(optionalFields, submit);

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!state.athleteId) return;

      if (state.logMode === 'competition' || state.practiceBarUp) {
        if (settings.units === 'imperial') {
          heightCm = toCmFromImperial(heightFeet.value, heightInches.value);
        } else {
          heightCm = toCmFromMetric(heightMeters.value);
        }
        if (!heightCm) {
          alert('Enter a valid bar height.');
          return;
        }
      }

      if (state.logMode === 'competition' && !selectedResult) {
        alert('Select a result.');
        return;
      }

      const jump = {
        athleteId: state.athleteId,
        mode: state.logMode,
        barUp: state.logMode === 'competition' ? true : state.practiceBarUp,
        heightCm: state.logMode === 'competition' || state.practiceBarUp ? heightCm : null,
        result: state.logMode === 'competition' || state.practiceBarUp ? selectedResult : null,
        attempt: state.logMode === 'competition' ? state.attempt : null,
        optional: {}
      };

      if (optionalValues.steps) jump.optional.steps = Number(optionalValues.steps.value);
      if (optionalValues.approach) jump.optional.approachCm = toCmFromImperial(optionalValues.approach.feet.value, optionalValues.approach.inches.value);
      if (optionalValues.coachMark) jump.optional.coachMarkCm = toCmFromImperial(optionalValues.coachMark.feet.value, optionalValues.coachMark.inches.value);
      if (optionalValues.takeoff) jump.optional.takeoffCm = toCmFromImperial(optionalValues.takeoff.feet.value, optionalValues.takeoff.inches.value);
      if (optionalValues.poleId) jump.optional.poleId = optionalValues.poleId.value || null;
      if (optionalValues.grip) jump.optional.gripCm = toCmFromImperial(optionalValues.grip.feet.value, optionalValues.grip.inches.value);
      if (optionalValues.standards) jump.optional.standards = optionalValues.standards.value;
      if (optionalValues.landing) jump.optional.landing = optionalValues.landing;
      if (optionalValues.poleBend) jump.optional.poleBend = optionalValues.poleBend;
      if (optionalValues.notes) jump.optional.notes = optionalValues.notes.value.trim();

      addJump(jump);

      if (state.logMode === 'competition' && selectedResult === 'make') {
        const athlete = getAthleteById(state.athleteId);
        if (athlete) {
          const currentPr = athlete.prCm || 0;
          if (heightCm > currentPr) {
            const confirmPr = confirm('This appears to be a new PR. Save it?');
            if (confirmPr) {
              updateAthlete({ ...athlete, prCm: heightCm });
            }
          }
        }
      }

      if (state.logMode === 'competition') {
        if (selectedResult === 'make') {
          state.attempt = 1;
        } else {
          state.attempt = Math.min(3, state.attempt + 1);
        }
      }
      state.lastHeightCm = heightCm;
      render();
    });

    card.appendChild(form);

    const recentCard = createElement('div', 'card');
    recentCard.appendChild(createElement('div', 'section-title', 'Recent Jumps'));
    const recentList = createElement('ul', 'list');
    getJumpsForAthlete(state.athleteId).slice(0, 3).forEach(jump => {
      const item = createElement('li', 'list-item');
      const info = createElement('div', 'list-info');
      const label = jump.mode === 'competition' ? 'Competition' : 'Practice';
      info.appendChild(createElement('div', 'list-name', `${label} — ${formatHeight(jump.heightCm, settings.units)}`));
      info.appendChild(createElement('div', 'list-meta', new Date(jump.createdAt).toLocaleString()));
      item.appendChild(info);
      recentList.appendChild(item);
    });
    if (!recentList.children.length) {
      recentList.appendChild(createElement('li', 'list-empty', 'No jumps logged yet.'));
    }
    recentCard.appendChild(recentList);

    screen.append(card, recentCard, renderBottomNav());
    return screen;
  }

  function renderReview() {
    const screen = createElement('section', 'screen');
    screen.appendChild(renderHeader('Jump Log'));

    const settings = getSettings();
    const athletes = getAthletesSorted();
    const card = createElement('div', 'card');
    const selector = createElement('select');
    athletes.forEach(athlete => {
      const option = createElement('option');
      option.value = athlete.id;
      option.textContent = athlete.name;
      selector.appendChild(option);
    });
    selector.value = state.reviewAthleteId || (athletes[0] && athletes[0].id);
    state.reviewAthleteId = selector.value;
    selector.addEventListener('change', event => {
      state.reviewAthleteId = event.target.value;
      render();
    });
    card.appendChild(selector);

    if (!athletes.length) {
      card.appendChild(createElement('div', 'empty-state', 'No athletes available.'));
      screen.append(card, renderBottomNav());
      return screen;
    }

    const jumps = getJumpsForAthlete(state.reviewAthleteId);
    const grouped = jumps.reduce((acc, jump) => {
      const dateKey = new Date(jump.createdAt).toLocaleDateString();
      if (!acc[dateKey]) acc[dateKey] = { practice: [], competition: [] };
      acc[dateKey][jump.mode].push(jump);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([date, group]) => {
      const dateSection = createElement('div', 'review-group');
      dateSection.appendChild(createElement('div', 'section-title', date));

      ['practice', 'competition'].forEach(type => {
        if (!group[type].length) return;
        const typeLabel = createElement('div', 'subsection-title', type === 'practice' ? 'Practice' : 'Competition');
        const list = createElement('ul', 'list');
        group[type].forEach(jump => {
          const item = createElement('li', 'list-item');
          const info = createElement('div', 'list-info');
          info.appendChild(createElement('div', 'list-name', formatHeight(jump.heightCm, settings.units)));
          info.appendChild(createElement('div', 'list-meta', jump.result ? jump.result.toUpperCase() : 'N/A'));
          item.appendChild(info);
          list.appendChild(item);
        });
        dateSection.append(typeLabel, list);
      });
      card.appendChild(dateSection);
    });

    if (!jumps.length) {
      card.appendChild(createElement('div', 'empty-state', 'No jumps logged yet.'));
    }

    screen.append(card, renderBottomNav());
    return screen;
  }

  function renderPoles() {
    const screen = createElement('section', 'screen');
    screen.appendChild(renderHeader('Poles'));

    const settings = getSettings();
    const data = loadData();

    const card = createElement('div', 'card');
    const sortRow = createElement('div', 'field-row');
    const sortLabel = createElement('label');
    sortLabel.textContent = 'Sort by';
    const sortSelect = createElement('select');
    const sortOptions = [{ value: 'length', label: 'Length / Weight' }];
    if (settings.poleFields.brand) sortOptions.push({ value: 'brand', label: 'Brand' });
    if (settings.poleFields.flex) sortOptions.push({ value: 'flex', label: 'Flex' });
    sortOptions.forEach(optionData => {
      const option = createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      sortSelect.appendChild(option);
    });
    sortRow.append(sortLabel, sortSelect);

    const grouped = {
      team: data.poles.filter(p => p.group === 'team'),
      borrowed: data.poles.filter(p => p.group === 'borrowed'),
    };

    const sortPoles = (poles) => {
      const sortBy = sortSelect.value;
      if (sortBy === 'brand') {
        return poles.slice().sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
      }
      if (sortBy === 'flex') {
        return poles.slice().sort((a, b) => (a.flex || '').localeCompare(b.flex || ''));
      }
      return poles.slice().sort((a, b) => Number(a.length) - Number(b.length) || Number(a.weight) - Number(b.weight));
    };

    const listGroup = (title, poles) => {
      const groupCard = createElement('div', 'card');
      groupCard.appendChild(createElement('div', 'section-title', title));
      const list = createElement('ul', 'list');
      const sorted = sortPoles(poles);
      if (!sorted.length) {
        list.appendChild(createElement('li', 'list-empty', 'No poles yet.'));
      }
      sorted.forEach(pole => {
        const item = createElement('li', 'list-item');
        const info = createElement('div', 'list-info');
        const labelParts = [`${pole.length} / ${pole.weight}`];
        if (settings.poleFields.brand && pole.brand) labelParts.push(pole.brand);
        if (settings.poleFields.flex && pole.flex) labelParts.push(`Flex ${pole.flex}`);
        if (settings.poleFields.nickname && pole.nickname) labelParts.push(pole.nickname);
        info.appendChild(createElement('div', 'list-name', labelParts.join(' · ')));
        item.appendChild(info);
        const actions = createElement('div', 'list-actions');
        const editBtn = createElement('button', 'ghost-button', 'Edit');
        const deleteBtn = createElement('button', 'ghost-button danger', 'Delete');
        editBtn.addEventListener('click', () => renderPoleForm(pole));
        deleteBtn.addEventListener('click', () => {
          if (confirm('Delete this pole?')) {
            deletePole(pole.id);
            render();
          }
        });
        actions.append(editBtn, deleteBtn);
        item.append(actions);
        list.appendChild(item);
      });
      groupCard.appendChild(list);
      return groupCard;
    };

    const formCard = createElement('div', 'card');
    formCard.appendChild(createElement('div', 'section-title', 'Add Pole'));
    const form = createElement('form');
    const lengthInput = createElement('input');
    lengthInput.type = 'text';
    lengthInput.placeholder = 'Length (e.g., 14\'0")';
    const weightInput = createElement('input');
    weightInput.type = 'text';
    weightInput.placeholder = 'Weight rating';
    const groupSelect = createElement('select');
    ['team', 'borrowed'].forEach(value => {
      const option = createElement('option');
      option.value = value;
      option.textContent = value === 'team' ? 'Team Bag' : 'Borrowed';
      groupSelect.appendChild(option);
    });

    const brandInput = createElement('input');
    brandInput.type = 'text';
    brandInput.placeholder = 'Brand';
    const flexInput = createElement('input');
    flexInput.type = 'text';
    flexInput.placeholder = 'Flex';
    const nicknameInput = createElement('input');
    nicknameInput.type = 'text';
    nicknameInput.placeholder = 'Nickname';

    form.append(lengthInput, weightInput, groupSelect);
    if (settings.poleFields.brand) form.appendChild(brandInput);
    if (settings.poleFields.flex) form.appendChild(flexInput);
    if (settings.poleFields.nickname) form.appendChild(nicknameInput);

    const submit = createElement('button', 'primary-button', 'Save Pole');
    submit.type = 'submit';
    form.appendChild(submit);

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!lengthInput.value.trim() || !weightInput.value.trim()) {
        alert('Length and weight are required.');
        return;
      }
      addPole({
        length: lengthInput.value.trim(),
        weight: weightInput.value.trim(),
        group: groupSelect.value,
        brand: brandInput.value.trim(),
        flex: flexInput.value.trim(),
        nickname: nicknameInput.value.trim(),
      });
      render();
    });

    formCard.appendChild(form);

    const renderPoleForm = (pole) => {
      lengthInput.value = pole.length;
      weightInput.value = pole.weight;
      groupSelect.value = pole.group;
      brandInput.value = pole.brand || '';
      flexInput.value = pole.flex || '';
      nicknameInput.value = pole.nickname || '';
      submit.textContent = 'Update Pole';
      form.onsubmit = event => {
        event.preventDefault();
        updatePole({
          ...pole,
          length: lengthInput.value.trim(),
          weight: weightInput.value.trim(),
          group: groupSelect.value,
          brand: brandInput.value.trim(),
          flex: flexInput.value.trim(),
          nickname: nicknameInput.value.trim(),
        });
        render();
      };
    };

    card.append(sortRow);

    screen.append(card, listGroup('Team Bag', grouped.team), listGroup('Borrowed Poles', grouped.borrowed), formCard, renderBottomNav());
    return screen;
  }

  function renderSettings() {
    const screen = createElement('section', 'screen');
    screen.appendChild(renderHeader('Settings'));

    const settings = getSettings();
    const card = createElement('div', 'card');

    const appearance = createElement('div', 'settings-group');
    appearance.appendChild(createElement('div', 'section-title', 'Appearance'));
    const appearanceSelect = createElement('select');
    ['light', 'dark'].forEach(value => {
      const option = createElement('option');
      option.value = value;
      option.textContent = value === 'light' ? 'Light' : 'Dark';
      if (settings.appearance === value) option.selected = true;
      appearanceSelect.appendChild(option);
    });
    appearance.appendChild(appearanceSelect);

    const units = createElement('div', 'settings-group');
    units.appendChild(createElement('div', 'section-title', 'Units'));
    const unitsSelect = createElement('select');
    ['imperial', 'metric'].forEach(value => {
      const option = createElement('option');
      option.value = value;
      option.textContent = value === 'imperial' ? 'Imperial (ft/in)' : 'Metric (m)';
      if (settings.units === value) option.selected = true;
      unitsSelect.appendChild(option);
    });
    units.appendChild(unitsSelect);

    const logging = createElement('div', 'settings-group');
    logging.appendChild(createElement('div', 'section-title', 'Logging Options'));

    const buildToggle = (labelText, key) => {
      const wrapper = createElement('label', 'toggle-row');
      const text = createElement('span', '', labelText);
      const input = createElement('input');
      input.type = 'checkbox';
      input.checked = settings[key];
      wrapper.append(text, input);
      return { wrapper, input };
    };

    const stepsModeRow = createElement('label', 'toggle-row');
    stepsModeRow.appendChild(createElement('span', '', 'Steps Counting Mode'));
    const stepsSelect = createElement('select');
    ['leftsRights', 'steps'].forEach(value => {
      const option = createElement('option');
      option.value = value;
      option.textContent = value === 'leftsRights' ? 'Lefts/Rights' : 'Steps';
      if (settings.stepsMode === value) option.selected = true;
      stepsSelect.appendChild(option);
    });
    stepsModeRow.appendChild(stepsSelect);
    logging.appendChild(stepsModeRow);

    const toggles = [
      { label: 'Steps', key: 'enableSteps' },
      { label: 'Approach Distance', key: 'enableApproachDistance' },
      { label: 'Coach\'s Mark', key: 'enableCoachMark' },
      { label: 'Takeoff Step', key: 'enableTakeoffStep' },
      { label: 'Pole Selection', key: 'enablePoleSelection' },
      { label: 'Grip Height', key: 'enableGripHeight' },
      { label: 'Standards', key: 'enableStandards' },
      { label: 'Landing', key: 'enableLanding' },
      { label: 'Pole Bend', key: 'enablePoleBend' },
      { label: 'Notes', key: 'enableNotes' },
    ];
    const toggleInputs = {};
    toggles.forEach(toggle => {
      const { wrapper, input } = buildToggle(toggle.label, toggle.key);
      toggleInputs[toggle.key] = input;
      logging.appendChild(wrapper);
    });

    const poleOptions = createElement('div', 'settings-group');
    poleOptions.appendChild(createElement('div', 'section-title', 'Pole Fields'));
    const poleToggles = ['brand', 'flex', 'nickname'];
    const poleInputs = {};
    poleToggles.forEach(key => {
      const wrapper = createElement('label', 'toggle-row');
      const text = createElement('span', '', key.charAt(0).toUpperCase() + key.slice(1));
      const input = createElement('input');
      input.type = 'checkbox';
      input.checked = settings.poleFields[key];
      wrapper.append(text, input);
      poleInputs[key] = input;
      poleOptions.appendChild(wrapper);
    });

    const dataGroup = createElement('div', 'settings-group');
    dataGroup.appendChild(createElement('div', 'section-title', 'Data Management'));
    const exportBtn = createElement('button', 'secondary-button', 'Export Data');
    exportBtn.type = 'button';
    exportBtn.addEventListener('click', () => {
      const url = exportData();
      const link = createElement('a');
      link.href = url;
      link.download = 'taykof-export.json';
      link.click();
      URL.revokeObjectURL(url);
    });
    dataGroup.appendChild(exportBtn);

    const saveBtn = createElement('button', 'primary-button', 'Save Settings');
    saveBtn.type = 'button';
    saveBtn.addEventListener('click', () => {
      saveSettings({
        appearance: appearanceSelect.value,
        units: unitsSelect.value,
        stepsMode: stepsSelect.value,
        enableSteps: toggleInputs.enableSteps.checked,
        enableApproachDistance: toggleInputs.enableApproachDistance.checked,
        enableCoachMark: toggleInputs.enableCoachMark.checked,
        enableTakeoffStep: toggleInputs.enableTakeoffStep.checked,
        enablePoleSelection: toggleInputs.enablePoleSelection.checked,
        enableGripHeight: toggleInputs.enableGripHeight.checked,
        enableStandards: toggleInputs.enableStandards.checked,
        enableLanding: toggleInputs.enableLanding.checked,
        enablePoleBend: toggleInputs.enablePoleBend.checked,
        enableNotes: toggleInputs.enableNotes.checked,
        poleFields: {
          brand: poleInputs.brand.checked,
          flex: poleInputs.flex.checked,
          nickname: poleInputs.nickname.checked,
        },
      });
      applyAppearance(appearanceSelect.value);
      render();
    });

    card.append(appearance, units, logging, poleOptions, dataGroup, saveBtn);
    screen.append(card, renderBottomNav());
    return screen;
  }

  function applyAppearance(mode) {
    document.body.dataset.theme = mode;
  }

  function render() {
    app.innerHTML = '';
    const settings = getSettings();
    applyAppearance(settings.appearance);

    let screen = null;
    switch (state.view) {
      case 'athletes':
        screen = renderAthletes();
        break;
      case 'athleteDetail':
        screen = renderAthleteDetail();
        break;
      case 'log':
        screen = renderLog();
        break;
      case 'review':
        screen = renderReview();
        break;
      case 'poles':
        screen = renderPoles();
        break;
      case 'settings':
        screen = renderSettings();
        break;
      default:
        screen = renderAthletes();
    }
    app.appendChild(screen);
  }

  render();
})();
