// Initialize Dexie
const db = new Dexie('DailyFlowDB');

// Declare schema
// templates: primary index 'id'
// daySlots: primary index 'id', query index 'date'
db.version(1).stores({
  templates: 'id',
  daySlots: 'id, date'
});

// Helper: Fire event when DB changes so UI can re-render
function fireStateChanged() {
  window.dispatchEvent(new CustomEvent('stateChanged'));
}

// Ensure defaults exist
async function ensureDefaults() {
  const count = await db.templates.count();
  if (count === 0) {
    await db.templates.add({
      id: 'template-sleep',
      name: 'Sleep',
      defaultDurationMinutes: 480, // 8 hours
      color: '#8b5cf6'
    });
    fireStateChanged();
  }
}

// ---- API ----

// Templates
async function getTemplates() {
  return await db.templates.toArray();
}

async function addTemplate(template) {
  await db.templates.add(template);
  fireStateChanged();
}

async function updateTemplate(id, updates) {
  await db.templates.update(id, updates);
  fireStateChanged();
}

async function deleteTemplate(id) {
  await db.templates.delete(id);
  fireStateChanged();
}

// Day Slots
async function getDaySlots(dateString) {
  const slots = await db.daySlots.where('date').equals(dateString).toArray();
  // Dexie returns them in id-order usually unless specified, so we sort by orderIndex
  return slots.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
}

async function addSlotToDay(dateString, slot) {
  // get current slots to figure out new orderIndex (put at end)
  const currentSlots = await getDaySlots(dateString);
  const maxOrder = currentSlots.reduce((max, s) => Math.max(max, s.orderIndex || 0), -1);
  
  slot.date = dateString;
  slot.orderIndex = maxOrder + 1;
  await db.daySlots.add(slot);
  fireStateChanged();
}

async function updateDaySlot(slotId, updates) {
  await db.daySlots.update(slotId, updates);
  fireStateChanged();
}

async function deleteDaySlot(slotId) {
  await db.daySlots.delete(slotId);
  fireStateChanged();
}

// Reordering handles bulk updating the orderIndex based on a new sorted array
async function reorderDaySlots(newSlotsArray) {
  await db.transaction('rw', db.daySlots, async () => {
    for (let i = 0; i < newSlotsArray.length; i++) {
      const slot = newSlotsArray[i];
      await db.daySlots.update(slot.id, { orderIndex: i });
    }
  });
  fireStateChanged();
}

async function getDayTotals(dateString) {
  const slots = await getDaySlots(dateString);
  const allocatedMinutes = slots.reduce((total, slot) => total + slot.durationMinutes, 0);
  const remainingMinutes = 1440 - allocatedMinutes;
  return { allocatedMinutes, remainingMinutes };
}

// Initialize on load
ensureDefaults();

window.state = {
  db, // expose db directly for advanced manual queries if needed
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getDaySlots,
  addSlotToDay,
  updateDaySlot,
  deleteDaySlot,
  reorderDaySlots,
  getDayTotals,
  fireStateChanged
};
