/**
 * Math utilities
 */
const random = (min = 0, max = 1) => {
  return Math.random() * (max - min) + min;
};

const randomInt = (min = 0, max = 10) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

const round = (value, decimals = 2) => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const percentage = (value, total) => {
  return (value / total) * 100;
};

const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const factorial = (n) => {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
};

module.exports = {
  random, randomInt, clamp, round, toRadians, toDegrees,
  distance, percentage, uuid, factorial
};