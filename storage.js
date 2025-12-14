(function () {
  const STORAGE_KEY = 'taykof_athletes_v1';
  const JUMP_STORAGE_KEY = 'taykof_jumps_v1';
  const SETTINGS_KEY = 'taykof_settings_v1';

  function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function normalizeAthlete(raw) {
    return {
      id: raw.id,
      name: raw.name,
      sex: raw.sex || 'Not set',
      note: raw.note || '',
      pr: raw.pr || '',
      createdAt: raw.createdAt || Date.now(),
    };
  }

  function read() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeAthlete);
    } catch (err) {
      console.error('Could not read saved athletes', err);
      return [];
    }
  }

  function write(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function normalizeJump(raw) {
    const storedBarValue = Number(raw.barValueCm);
    const rawSessionType = raw.sessionType;
    const sessionType = rawSessionType === 'competition' ? 'competition' : 'practice';
    const hasBarUp = typeof raw.barUp === 'boolean';
    const barUp = hasBarUp
      ? raw.barUp
      : rawSessionType === 'practice'
        ? false
        : sessionType === 'competition'
          ? true
          : true;

    return {
      id: raw.id,
      athleteId: raw.athleteId,
      date: raw.date,
      bar: raw.bar || raw.barRaw || '',
      barRaw: typeof raw.barRaw === 'string' ? raw.barRaw : raw.bar || '',
      barValueCm: Number.isFinite(storedBarValue) ? storedBarValue : null,
      barUnitMode: raw.barUnitMode === 'metric' ? 'metric' : 'imperial',
      result: raw.result === 'miss' ? 'miss' : 'make',
      sessionType,
      barUp,
      note: raw.note || '',
      createdAt: raw.createdAt || Date.now(),
    };
  }

  function readJumps() {
    const saved = localStorage.getItem(JUMP_STORAGE_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeJump);
    } catch (err) {
      console.error('Could not read saved jumps', err);
      return [];
    }
  }

  function writeJumps(list) {
    localStorage.setItem(JUMP_STORAGE_KEY, JSON.stringify(list));
  }

  window.AthleteStore = {
    getAll() {
      return read();
    },
    getById(id) {
      return read().find((athlete) => athlete.id === id) || null;
    },
    add({ name, sex }) {
      const trimmedName = name.trim();
      const normalizedSex = sex || 'Not set';
      if (!trimmedName) return null;
      const athletes = read();
      const athlete = {
        id: createId(),
        name: trimmedName,
        sex: normalizedSex,
        note: '',
        pr: '',
        createdAt: Date.now(),
      };
      athletes.push(athlete);
      write(athletes);
      return athlete;
    },
    update(id, updates) {
      const athletes = read();
      const updated = athletes.map((athlete) => {
        if (athlete.id !== id) return athlete;
        return { ...athlete, ...updates };
      });
      write(updated);
      return this.getById(id);
    },
    remove(id) {
      const athletes = read();
      const filtered = athletes.filter((athlete) => athlete.id !== id);
      write(filtered);
      return filtered;
    },
  };

  window.JumpStore = {
    getAll() {
      return readJumps();
    },
    getByAthlete(athleteId) {
      return readJumps().filter((jump) => jump.athleteId === athleteId);
    },
    remove(id) {
      const jumps = readJumps();
      const filtered = jumps.filter((jump) => jump.id !== id);
      writeJumps(filtered);
      return filtered;
    },
    add({ athleteId, date, barRaw, barValueCm, barUnitMode, result, sessionType, note, barUp }) {
      const trimmedBar = (barRaw || '').trim();
      const trimmedNote = (note || '').trim();
      const normalizedSessionType = sessionType === 'competition' ? 'competition' : 'practice';
      const normalizedBarUp = typeof barUp === 'boolean' ? barUp : normalizedSessionType === 'competition';

      if (!athleteId || !date || !result) return null;
      if (normalizedBarUp && !trimmedBar) return null;

      const jump = {
        id: createId(),
        athleteId,
        date,
        bar: normalizedBarUp ? trimmedBar : '',
        barRaw: normalizedBarUp ? trimmedBar : '',
        barValueCm: normalizedBarUp && Number.isFinite(barValueCm) ? barValueCm : null,
        barUnitMode: barUnitMode === 'metric' ? 'metric' : 'imperial',
        result: result === 'miss' ? 'miss' : 'make',
        sessionType: normalizedSessionType,
        barUp: normalizedBarUp,
        note: trimmedNote,
        createdAt: Date.now(),
      };

      const jumps = readJumps();
      jumps.push(jump);
      writeJumps(jumps);
      return jump;
    },
  };

  function readSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return { unitMode: 'imperial' };
    try {
      const parsed = JSON.parse(saved);
      return {
        unitMode: parsed.unitMode === 'metric' ? 'metric' : 'imperial',
      };
    } catch (err) {
      console.error('Could not read settings', err);
      return { unitMode: 'imperial' };
    }
  }

  function writeSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  window.SettingsStore = {
    getUnitMode() {
      const saved = readSettings();
      return saved.unitMode === 'metric' ? 'metric' : 'imperial';
    },
    setUnitMode(mode) {
      const unitMode = mode === 'metric' ? 'metric' : 'imperial';
      writeSettings({ unitMode });
      return unitMode;
    },
  };
})();
