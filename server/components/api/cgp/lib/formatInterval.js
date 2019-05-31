module.exports = function formatInterval(interval) {
  return isNaN(Number(interval)) ? null : Number(interval);
};
