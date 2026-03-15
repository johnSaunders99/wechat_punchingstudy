function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateStr(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeStr(ts) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = {
  toDateStr,
  toTimeStr
};
