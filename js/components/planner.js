// DOM Elements
const plannerSlotsList = document.getElementById('day-slots-list');
const allocatedTimeEl = document.getElementById('allocated-time');
const remainingTimeEl = document.getElementById('remaining-time');
const remainingCardEl = document.getElementById('remaining-card');
const progressFill = document.getElementById('progress-fill');
const customSlotForm = document.getElementById('custom-slot-form');
const libSelectModal = document.getElementById('library-select-modal');
const libSelectList = document.getElementById('library-select-list');

// Drag and drop state
let draggedSlotId = null;

// internal render
async function renderPlanner(dateString) {
  const slots = await window.state.getDaySlots(dateString);
  const totals = await window.state.getDayTotals(dateString);
  
  // Update summaries
  allocatedTimeEl.innerText = window.utils.formatDuration(totals.allocatedMinutes);
  
  if (totals.remainingMinutes >= 0) {
    remainingTimeEl.innerText = window.utils.formatDuration(totals.remainingMinutes);
    remainingTimeEl.className = 'summary-value';
    remainingCardEl.className = 'summary-card';
  } else {
    remainingTimeEl.innerText = '-' + window.utils.formatDuration(Math.abs(totals.remainingMinutes));
    remainingTimeEl.className = 'summary-value text-error';
  }

  // Progress Bar
  const pct = Math.min(100, Math.max(0, (totals.allocatedMinutes / 1440) * 100));
  progressFill.style.width = `${pct}%`;
  if (pct === 100) progressFill.style.backgroundColor = 'var(--success-color)';
  else if (totals.remainingMinutes < 0) progressFill.style.backgroundColor = 'var(--error-color)';
  else progressFill.style.backgroundColor = 'var(--accent-color)';

  // Slots List
  plannerSlotsList.innerHTML = '';
  
  let runningTimeMins = 0;

  if (slots.length === 0) {
    plannerSlotsList.innerHTML = '<div class="empty-state"><h3>Your day is empty</h3><p>Add activities to plan your 24 hours.</p></div>';
    document.getElementById('finish-time').innerText = '00:00';
    return;
  }

  slots.forEach((slot, index) => {
    const startMins = runningTimeMins;
    const endMins = startMins + slot.durationMinutes;
    runningTimeMins = endMins;
    const timeRangeStr = `${window.utils.formatTimeBoundary(startMins)} - ${window.utils.formatTimeBoundary(endMins)}`;
    const el = document.createElement('div');
    el.className = 'slot-item';
    el.draggable = true;
    el.dataset.id = slot.id;
    el.dataset.index = index;

    const sourceTag = slot.sourceType === 'template' ? 'Library' : 'Custom';
    
    el.innerHTML = `
      <div class="slot-drag-handle" title="Drag to reorder">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>
      <div class="slot-color-indicator" style="background-color: ${slot.color}"></div>
      <div class="slot-details" style="flex:1;">
        <div class="slot-name">${window.utils.escapeHTML(slot.name)}</div>
        <div class="slot-meta">
          <span class="slot-tag">${sourceTag}</span>
          <span class="slot-time-range" title="Estimated schedule. Assuming day starts at 00:00" style="font-family:monospace; margin-left:8px; color:var(--text-secondary); background: var(--bg-surface-hover); padding: 2px 6px; border-radius:4px; font-size: 0.8rem; letter-spacing:0.5px;">${timeRangeStr}</span>
        </div>
      </div>
      <div class="slot-duration">${window.utils.formatDuration(slot.durationMinutes)}</div>
      <div class="slot-actions">
        ${slot.sourceType === 'custom' ? `
        <button class="icon-btn save-template-btn" data-id="${slot.id}" title="Save as Template">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </button>
        ` : ''}
        <button class="icon-btn duplicate-slot-btn" data-id="${slot.id}" title="Duplicate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button class="icon-btn edit-slot-btn" data-id="${slot.id}" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="icon-btn text-error delete-slot-btn" data-id="${slot.id}" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;

    // Drag events
    el.addEventListener('dragstart', (e) => {
      draggedSlotId = slot.id;
      e.dataTransfer.effectAllowed = 'move';
      // tiny delay to allow class toggle after paint
      setTimeout(() => el.classList.add('dragging'), 0);
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      draggedSlotId = null;
    });

    plannerSlotsList.appendChild(el);
  });

  // Set final finish time
  const finishTimeEl = document.getElementById('finish-time');
  if (finishTimeEl) {
    finishTimeEl.innerText = window.utils.formatTimeBoundary(runningTimeMins);
    finishTimeEl.style.color = runningTimeMins > 1440 ? 'var(--warning-color)' : 'var(--text-primary)';
  }
}

// Drag over lists
plannerSlotsList.addEventListener('dragover', e => {
  e.preventDefault(); // allow drop
  const draggingEl = plannerSlotsList.querySelector('.dragging');
  if (!draggingEl) return;
  const afterElement = getDragAfterElement(plannerSlotsList, e.clientY);
  if (afterElement == null) {
    plannerSlotsList.appendChild(draggingEl);
  } else {
    plannerSlotsList.insertBefore(draggingEl, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.slot-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

plannerSlotsList.addEventListener('drop', async (e) => {
  e.preventDefault();
  const currentItems = [...plannerSlotsList.querySelectorAll('.slot-item')];
  const dateStr = window.app.activeDateString;
  const oldSlots = await window.state.getDaySlots(dateStr);
  
  // Rebuild array based on dom IDs
  const newSlots = currentItems.map(item => {
    return oldSlots.find(s => s.id === item.dataset.id);
  }).filter(Boolean);

  await window.state.reorderDaySlots(newSlots);
});

// Slot actions
plannerSlotsList.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.edit-slot-btn');
  const deleteBtn = e.target.closest('.delete-slot-btn');
  const duplicateBtn = e.target.closest('.duplicate-slot-btn');
  const saveTemplateBtn = e.target.closest('.save-template-btn');
  const dateStr = window.app.activeDateString;

  if (deleteBtn) {
    await window.state.deleteDaySlot(deleteBtn.dataset.id);
  }

  if (duplicateBtn) {
    const slots = await window.state.getDaySlots(dateStr);
    const slot = slots.find(s => s.id === duplicateBtn.dataset.id);
    if (slot) {
      const newSlot = { ...slot, id: window.utils.generateId() };
      await window.state.addSlotToDay(dateStr, newSlot);
    }
  }

  if (saveTemplateBtn) {
    const slots = await window.state.getDaySlots(dateStr);
    const slot = slots.find(s => s.id === saveTemplateBtn.dataset.id);
    if (slot) {
      document.getElementById('tp-id').value = '';
      document.getElementById('tp-name').value = slot.name;
      document.getElementById('tp-hours').value = Math.floor(slot.durationMinutes / 60);
      document.getElementById('tp-minutes').value = slot.durationMinutes % 60;
      document.getElementById('tp-color').value = slot.color;
      document.getElementById('template-modal-title').innerText = 'Create Template from Custom Slot';
      
      document.querySelectorAll('#tp-color-picker .color-option').forEach(btn => btn.classList.remove('selected'));
      const activeColorBtn = document.querySelector(`#tp-color-picker .color-option[data-color="${slot.color}"]`);
      if (activeColorBtn) activeColorBtn.classList.add('selected');

      window.app.openModal('template-modal');
    }
  }

  if (editBtn) {
    const slots = await window.state.getDaySlots(dateStr);
    const slot = slots.find(s => s.id === editBtn.dataset.id);
    if (slot) {
      document.getElementById('cs-id').value = slot.id;
      document.getElementById('cs-name').value = slot.name;
      document.getElementById('cs-hours').value = Math.floor(slot.durationMinutes / 60);
      document.getElementById('cs-minutes').value = slot.durationMinutes % 60;
      document.getElementById('cs-color').value = slot.color;
      document.getElementById('custom-slot-modal-title').innerText = 'Edit Day Slot';
      
      document.querySelectorAll('#cs-color-picker .color-option').forEach(btn => btn.classList.remove('selected'));
      const activeColorBtn = document.querySelector(`#cs-color-picker .color-option[data-color="${slot.color}"]`);
      if (activeColorBtn) activeColorBtn.classList.add('selected');

      window.app.openModal('custom-slot-modal');
    }
  }
});

// Custom slot form submission
customSlotForm.addEventListener('submit', async e => {
  e.preventDefault();
  const dateStr = window.app.activeDateString;
  const id = document.getElementById('cs-id').value;
  const name = document.getElementById('cs-name').value.trim();
  const h = parseInt(document.getElementById('cs-hours').value) || 0;
  const m = parseInt(document.getElementById('cs-minutes').value) || 0;
  const color = document.getElementById('cs-color').value;

  const totalMinutes = h * 60 + m;
  if (totalMinutes === 0) {
    alert("Duration must be greater than 0");
    return;
  }

  if (id) {
    // update
    await window.state.updateDaySlot(id, {
      name,
      durationMinutes: totalMinutes,
      color
    });
  } else {
    // create new custom slot
    const newSlot = {
      id: window.utils.generateId(),
      date: dateStr,
      sourceType: "custom",
      templateId: null,
      name,
      durationMinutes: totalMinutes,
      color,
      category: "Uncategorized",
      orderIndex: 0 // initialized dynamically in state.js
    };
    await window.state.addSlotToDay(dateStr, newSlot);
  }

  window.app.closeModal('custom-slot-modal');
});

// Add from Library logic
document.getElementById('add-from-library-btn').addEventListener('click', async () => {
  const templates = await window.state.getTemplates();
  libSelectList.innerHTML = '';
  if (templates.length === 0) {
    libSelectList.innerHTML = '<div class="p-4 text-center">No templates yet. Create one in the Library.</div>';
  } else {
    templates.forEach(t => {
      const item = document.createElement('div');
      item.className = 'library-select-item';
      item.innerHTML = `
        <div class="library-card-color" style="background-color: ${t.color}"></div>
        <div class="font-medium mr-4" style="flex:1; font-weight:600;">${window.utils.escapeHTML(t.name)}</div>
        <div class="text-sm text-secondary" style="margin-right:24px;">${window.utils.formatDuration(t.defaultDurationMinutes)}</div>
        <div class="library-select-action" style="color:var(--accent-color);font-weight:600;">+ Add to Day</div>
      `;
      item.addEventListener('click', async () => {
        // Create instance copy
        const newSlot = {
          id: window.utils.generateId(),
          date: window.app.activeDateString,
          sourceType: "template",
          templateId: t.id,
          name: t.name,
          durationMinutes: t.defaultDurationMinutes,
          color: t.color,
          category: t.category || "Uncategorized"
        };
        await window.state.addSlotToDay(window.app.activeDateString, newSlot);
        window.app.closeModal('library-select-modal');
      });
      libSelectList.appendChild(item);
    });
  }
  window.app.openModal('library-select-modal');
});

// Add custom slot modal open
document.getElementById('add-custom-slot-btn').addEventListener('click', () => {
  document.getElementById('cs-id').value = '';
  document.getElementById('cs-name').value = '';
  document.getElementById('cs-hours').value = 1;
  document.getElementById('cs-minutes').value = 0;
  document.getElementById('cs-color').value = '#3b82f6';
  document.getElementById('custom-slot-modal-title').innerText = 'Create Custom Slot';
  
  document.querySelectorAll('#cs-color-picker .color-option').forEach(btn => btn.classList.remove('selected'));
  document.querySelector('#cs-color-picker .color-option[data-color="#3b82f6"]').classList.add('selected');

  window.app.openModal('custom-slot-modal');
});

window.planner = {
  render: renderPlanner
};
