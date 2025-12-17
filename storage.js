(function () {
  const STORAGE_KEY = 'taykof_athletes_v1';
  const JUMP_STORAGE_KEY = 'taykof_jumps_v1';
  const SETTINGS_KEY = 'taykof_settings_v1';

  function notifyStorageError(err) {
    console.error('Storage is unavailable', err);
    window.dispatchEvent(
      new CustomEvent('app-storage-error', {
        detail: { message: 'Saving data is unavailable right now. Data may not persist.' },
      }),
    );
  }

  function safeGetItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      notifyStorageError(err);
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      notifyStorageError(err);
      return false;
    }
  }

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
    const saved = safeGetItem(STORAGE_KEY);
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
    return safeSetItem(STORAGE_KEY, JSON.stringify(list));
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
      result: raw.result === 'miss' ? 'miss' : raw.result === 'make' ? 'make' : null,
      sessionType,
      barUp,
      note: raw.note || '',
      createdAt: raw.createdAt || Date.now(),
    };
  }

  function readJumps() {
    const saved = safeGetItem(JUMP_STORAGE_KEY);
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
    return safeSetItem(JUMP_STORAGE_KEY, JSON.stringify(list));
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
      const saved = write(athletes);
      return saved ? athlete : null;
    },
    update(id, updates) {
      const athletes = read();
      const updated = athletes.map((athlete) => {
        if (athlete.id !== id) return athlete;
        return { ...athlete, ...updates };
      });
      const saved = write(updated);
      return saved ? this.getById(id) : null;
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

      const requireResult = normalizedSessionType === 'competition' || normalizedBarUp;

      if (!athleteId || !date || (requireResult && !result)) return null;
      if (normalizedBarUp && !trimmedBar) return null;

      const jump = {
        id: createId(),
        athleteId,
        date,
        bar: normalizedBarUp ? trimmedBar : '',
        barRaw: normalizedBarUp ? trimmedBar : '',
        barValueCm: normalizedBarUp && Number.isFinite(barValueCm) ? barValueCm : null,
        barUnitMode: barUnitMode === 'metric' ? 'metric' : 'imperial',
        result: result === 'miss' ? 'miss' : result === 'make' ? 'make' : null,
        sessionType: normalizedSessionType,
        barUp: normalizedBarUp,
        note: trimmedNote,
        createdAt: Date.now(),
      };

      const jumps = readJumps();
      jumps.push(jump);
      const saved = writeJumps(jumps);
      return saved ? jump : null;
    },
  };

  function readSettings() {
    const saved = safeGetItem(SETTINGS_KEY);
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
    return safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
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
