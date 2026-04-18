// Helper: Fire event when DB changes so UI can re-render
function fireStateChanged() {
  window.dispatchEvent(new CustomEvent('stateChanged'));
}

// ---- API ----

// Templates
async function getTemplates() {
  const { data, error } = await window.supabaseClient
    .from('templates')
    .select('*')
    .eq('user_id', window.auth.user.id)
    .order('created_at', { ascending: true });
  if (error) console.error('Full Error:', error);
  return data || [];
}

async function addTemplate(template) {
  console.log('User ID:', window.auth.user.id);
  const insertData = {
    name: template.name,
    duration: template.duration,
    user_id: window.auth.user.id
  };
  const { error } = await window.supabaseClient.from('templates').insert([insertData]);
  if (error) console.error('Full Error:', error);
  fireStateChanged();
}

async function updateTemplate(id, updates) {
  const cleanUpdates = {};
  if (updates.name !== undefined) cleanUpdates.name = updates.name;
  if (updates.duration !== undefined) cleanUpdates.duration = updates.duration;

  const { error } = await window.supabaseClient
    .from('templates')
    .update(cleanUpdates)
    .eq('id', id)
    .eq('user_id', window.auth.user.id);
  if (error) console.error('Full Error:', error);
  fireStateChanged();
}

async function deleteTemplate(id) {
  const { error } = await window.supabaseClient
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('user_id', window.auth.user.id);
  if (error) console.error('Full Error:', error);
  fireStateChanged();
}

// Day Slots
async function getDaySlots(dateString) {
  const { data, error } = await window.supabaseClient
    .from('day_slots')
    .select('*')
    .eq('slot_date', dateString)
    .eq('user_id', window.auth.user.id)
    .order('created_at', { ascending: true });
  if (error) console.error('Full Error:', error);
  return data || [];
}

async function addSlotToDay(dateString, slot) {
  console.log('User ID:', window.auth.user.id);
  const insertData = {
    task_name: slot.task_name,
    duration: slot.duration,
    slot_date: dateString,
    user_id: window.auth.user.id
  };
  
  const { error } = await window.supabaseClient.from('day_slots').insert([insertData]);
  if (error) console.error('Full Error:', error);
  fireStateChanged();
}

async function updateDaySlot(slotId, updates) {
  const cleanUpdates = {};
  if (updates.task_name !== undefined) cleanUpdates.task_name = updates.task_name;
  if (updates.duration !== undefined) cleanUpdates.duration = updates.duration;

  const { error } = await window.supabaseClient
    .from('day_slots')
    .update(cleanUpdates)
    .eq('id', slotId)
    .eq('user_id', window.auth.user.id);
  if (error) console.error('Full Error:', error);
  fireStateChanged();
}

async function deleteDaySlot(slotId) {
  const { error } = await window.supabaseClient
    .from('day_slots')
    .delete()
    .eq('id', slotId)
    .eq('user_id', window.auth.user.id);
  if (error) console.error('Full Error:', error);
  fireStateChanged();
}

// Reordering via drag-and-drop no longer persists a custom order
async function reorderDaySlots(newSlotsArray) {
  // We just fire state changed to trigger re-renders if necessary
  fireStateChanged();
}

async function getDayTotals(dateString) {
  const slots = await getDaySlots(dateString);
  const allocatedMinutes = slots.reduce((total, slot) => total + (slot.duration || 0), 0);
  const remainingMinutes = 1440 - allocatedMinutes;
  return { allocatedMinutes, remainingMinutes };
}

window.state = {
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
