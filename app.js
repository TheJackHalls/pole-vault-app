(function () {
  const form = document.getElementById('athlete-form');
  const nameInput = document.getElementById('athlete-name');
  const noteInput = document.getElementById('athlete-note');
  const listEl = document.getElementById('athlete-list');
  const emptyState = document.getElementById('empty-state');
  const errorEl = document.getElementById('form-error');

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

        if (athlete.note) {
          const note = document.createElement('p');
          note.className = 'athlete-note';
          note.textContent = athlete.note;
          meta.appendChild(note);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('aria-label', `Delete ${athlete.name}`);
        deleteBtn.addEventListener('click', () => {
          AthleteStore.remove(athlete.id);
          renderAthletes();
        });

        item.appendChild(meta);
        item.appendChild(deleteBtn);
        listEl.appendChild(item);
      });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const name = nameInput.value;
    const note = noteInput.value;

    if (!name.trim()) {
      errorEl.textContent = 'Name is required.';
      nameInput.focus();
      return;
    }

    const added = AthleteStore.add({ name, note });
    if (!added) {
      errorEl.textContent = 'Unable to save athlete. Please try again.';
      return;
    }

    errorEl.textContent = '';
    form.reset();
    nameInput.focus();
    renderAthletes();
  }

  form.addEventListener('submit', handleSubmit);
  renderAthletes();
})();
