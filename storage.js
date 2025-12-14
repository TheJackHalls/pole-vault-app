(function () {
  const STORAGE_KEY = 'taykof_athletes_v1';

  function read() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
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
    add({ name, note }) {
      const trimmedName = name.trim();
      const trimmedNote = note.trim();
      if (!trimmedName) return null;
      const athletes = read();
      const athlete = {
        id: createId(),
        name: trimmedName,
        note: trimmedNote,
        createdAt: Date.now(),
      };
      athletes.push(athlete);
      write(athletes);
      return athlete;
    },
    remove(id) {
      const athletes = read();
      const filtered = athletes.filter((athlete) => athlete.id !== id);
      write(filtered);
      return filtered;
    },
  };
})();
