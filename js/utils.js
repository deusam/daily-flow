// Generate a pseudo-random UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function padTime(n) { return n < 10 ? '0' + n : n; }

function formatTimeBoundary(minutes) {
  if (minutes === 1440) return "24:00";
  
  const days = Math.floor(minutes / 1440);
  const remainingMins = minutes % 1440;
  const h = Math.floor(remainingMins / 60);
  const m = remainingMins % 60;
  
  let timeStr = `${padTime(h)}:${padTime(m)}`;
  if (days > 0 && minutes > 1440) {
    timeStr += ` (+${days}d)`;
  }
  return timeStr;
}

// Convert minutes to "Xh Ym"
function formatDuration(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// Get standard YYYY-MM-DD format for local date
function getLocalDateString(date) {
  const offset = date.getTimezoneOffset()
  date = new Date(date.getTime() - (offset*60*1000))
  return date.toISOString().split('T')[0]
}

// Provide a friendly date string (e.g., "Monday, Oct 12")
function friendlyDate(dateString) {
  const date = new Date(dateString + 'T00:00:00'); // Prevent timezone shift
  const todayStr = getLocalDateString(new Date());
  
  if (dateString === todayStr) {
    return 'Today, ' + date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // check yesterday/tomorrow
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateString === getLocalDateString(yesterday)) {
    return 'Yesterday, ' + date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateString === getLocalDateString(tomorrow)) {
    return 'Tomorrow, ' + date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

// HTML encoding for safety
function escapeHTML(str) {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
}

window.utils = {
  generateId,
  padTime,
  formatTimeBoundary,
  formatDuration,
  getLocalDateString,
  friendlyDate,
  escapeHTML
};
