(function () {
  const STORAGE_KEY = 'taykof_athletes_v1';

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

  function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
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
})();
