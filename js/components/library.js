// DOM Elements
const libraryGrid = document.getElementById('library-grid');
const createTemplateBtn = document.getElementById('create-template-btn');
const templateModal = document.getElementById('template-modal');
const templateForm = document.getElementById('template-form');

// Internal functions
async function renderLibrary() {
  const templates = await window.state.getTemplates();
  libraryGrid.innerHTML = '';

  if (templates.length === 0) {
    libraryGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><h3>No templates yet</h3><p>Create reusable slots to easily plan your days.</p></div>';
    return;
  }

  templates.forEach(t => {
    const card = document.createElement('div');
    card.className = 'library-card';
    card.innerHTML = `
      <div class="library-card-header">
        <div class="library-card-color" style="background-color: ${t.color}"></div>
        <h4>${window.utils.escapeHTML(t.name)}</h4>
      </div>
      <div class="library-card-duration">
        ${window.utils.formatDuration(t.defaultDurationMinutes)}
      </div>
      <div class="library-card-actions">
        <button class="icon-btn edit-template-btn" data-id="${t.id}" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="icon-btn text-error delete-template-btn" data-id="${t.id}" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
    libraryGrid.appendChild(card);
  });
}

// Bind Events
createTemplateBtn.addEventListener('click', () => {
  document.getElementById('tp-id').value = '';
  document.getElementById('tp-name').value = '';
  document.getElementById('tp-hours').value = 1;
  document.getElementById('tp-minutes').value = 0;
  document.getElementById('tp-color').value = '#3b82f6';
  document.getElementById('template-modal-title').innerText = 'Create Template';
  
  // reset color picker UI
  document.querySelectorAll('#tp-color-picker .color-option').forEach(btn => btn.classList.remove('selected'));
  document.querySelector('#tp-color-picker .color-option[data-color="#3b82f6"]').classList.add('selected');

  window.app.openModal('template-modal');
});

templateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('tp-id').value;
  const name = document.getElementById('tp-name').value.trim();
  const h = parseInt(document.getElementById('tp-hours').value) || 0;
  const m = parseInt(document.getElementById('tp-minutes').value) || 0;
  const color = document.getElementById('tp-color').value;

  const totalMinutes = h * 60 + m;
  if (totalMinutes === 0) {
    alert("Duration must be greater than 0");
    return;
  }

  if (id) {
    // update
    await window.state.updateTemplate(id, { name, defaultDurationMinutes: totalMinutes, color });
  } else {
    // create
    await window.state.addTemplate({
      id: window.utils.generateId(),
      name,
      defaultDurationMinutes: totalMinutes,
      color
    });
  }

  window.app.closeModal('template-modal');
});

// Using event delegation for edit/delete buttons
libraryGrid.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.edit-template-btn');
  const deleteBtn = e.target.closest('.delete-template-btn');

  if (editBtn) {
    const id = editBtn.dataset.id;
    const templates = await window.state.getTemplates();
    const template = templates.find(t => t.id === id);
    if (template) {
      document.getElementById('tp-id').value = template.id;
      document.getElementById('tp-name').value = template.name;
      document.getElementById('tp-hours').value = Math.floor(template.defaultDurationMinutes / 60);
      document.getElementById('tp-minutes').value = template.defaultDurationMinutes % 60;
      document.getElementById('tp-color').value = template.color;
      document.getElementById('template-modal-title').innerText = 'Edit Template';
      
      document.querySelectorAll('#tp-color-picker .color-option').forEach(btn => btn.classList.remove('selected'));
      const activeColorBtn = document.querySelector(`#tp-color-picker .color-option[data-color="${template.color}"]`);
      if (activeColorBtn) activeColorBtn.classList.add('selected');

      window.app.openModal('template-modal');
    }
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (confirm("Delete this template? Note: Past days using this template keep their copied slot unaffected.")) {
      await window.state.deleteTemplate(id);
    }
  }
});

// Expose render function for state changes
window.library = {
  render: renderLibrary
};
