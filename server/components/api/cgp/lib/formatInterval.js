module.exports = function formatInterval(interval) {
  return isNaN(interval) ? null : Number(interval);
};
