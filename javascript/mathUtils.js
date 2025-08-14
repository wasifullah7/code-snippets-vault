/**
 * Advanced mathematical utilities for modern JavaScript
 * Collection of commonly needed mathematical operations with performance optimizations
 */

/**
 * Round number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded number
 */
function roundTo(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {number} Percentage
 */
function calculatePercentage(value, total, decimals = 2) {
  if (total === 0) return 0;
  return roundTo((value / total) * 100, decimals);
}

/**
 * Generate random number within range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {boolean} inclusive - Include max value (default: true)
 * @returns {number} Random number
 */
function randomInRange(min, max, inclusive = true) {
  const range = max - min + (inclusive ? 1 : 0);
  return Math.floor(Math.random() * range) + min;
}

/**
 * Clamp number between min and max values
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped number
 */
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

/**
 * Map value from one range to another
 * @param {number} value - Value to map
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Calculate factorial
 * @param {number} n - Number to calculate factorial for
 * @returns {number} Factorial result
 */
function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Calculate greatest common divisor
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} GCD
 */
function gcd(a, b) {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

/**
 * Calculate least common multiple
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} LCM
 */
function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Check if number is prime
 * @param {number} num - Number to check
 * @returns {boolean} True if prime
 */
function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  
  const sqrt = Math.sqrt(num);
  for (let i = 3; i <= sqrt; i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

/**
 * Generate array of prime numbers up to limit
 * @param {number} limit - Upper limit
 * @returns {Array} Array of prime numbers
 */
function generatePrimes(limit) {
  const primes = [];
  const sieve = new Array(limit + 1).fill(true);
  sieve[0] = sieve[1] = false;
  
  for (let i = 2; i <= Math.sqrt(limit); i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= limit; j += i) {
        sieve[j] = false;
      }
    }
  }
  
  for (let i = 2; i <= limit; i++) {
    if (sieve[i]) primes.push(i);
  }
  
  return primes;
}

/**
 * Calculate sum of array
 * @param {Array} arr - Array of numbers
 * @returns {number} Sum
 */
function sum(arr) {
  return arr.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculate average of array
 * @param {Array} arr - Array of numbers
 * @returns {number} Average
 */
function average(arr) {
  if (arr.length === 0) return 0;
  return sum(arr) / arr.length;
}

/**
 * Calculate median of array
 * @param {Array} arr - Array of numbers
 * @returns {number} Median
 */
function median(arr) {
  if (arr.length === 0) return 0;
  
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate mode of array
 * @param {Array} arr - Array of numbers
 * @returns {Array} Mode(s)
 */
function mode(arr) {
  const frequency = {};
  let maxFreq = 0;
  
  arr.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
    maxFreq = Math.max(maxFreq, frequency[num]);
  });
  
  return Object.keys(frequency)
    .filter(key => frequency[key] === maxFreq)
    .map(Number);
}

/**
 * Calculate standard deviation
 * @param {Array} arr - Array of numbers
 * @returns {number} Standard deviation
 */
function standardDeviation(arr) {
  if (arr.length === 0) return 0;
  
  const avg = average(arr);
  const squaredDiffs = arr.map(val => Math.pow(val - avg, 2));
  const variance = average(squaredDiffs);
  
  return Math.sqrt(variance);
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees
 * @returns {number} Radians
 */
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Radians
 * @returns {number} Degrees
 */
function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point x
 * @param {number} y1 - First point y
 * @param {number} x2 - Second point x
 * @param {number} y2 - Second point y
 * @returns {number} Distance
 */
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate distance between two 3D points
 * @param {number} x1 - First point x
 * @param {number} y1 - First point y
 * @param {number} z1 - First point z
 * @param {number} x2 - Second point x
 * @param {number} y2 - Second point y
 * @param {number} z2 - Second point z
 * @returns {number} Distance
 */
function distance3D(x1, y1, z1, x2, y2, z2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format number as currency
 * @param {number} num - Number to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted currency
 */
function formatCurrency(num, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(num);
}

/**
 * Check if number is within tolerance
 * @param {number} a - First number
 * @param {number} b - Second number
 * @param {number} tolerance - Tolerance value (default: 0.001)
 * @returns {boolean} True if within tolerance
 */
function isWithinTolerance(a, b, tolerance = 0.001) {
  return Math.abs(a - b) <= tolerance;
}

/**
 * Generate Fibonacci sequence
 * @param {number} n - Number of terms
 * @returns {Array} Fibonacci sequence
 */
function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  
  const sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence.push(sequence[i - 1] + sequence[i - 2]);
  }
  
  return sequence;
}

// Example usage:
// console.log(roundTo(3.14159, 2)); // 3.14
// console.log(calculatePercentage(25, 100)); // 25
// console.log(randomInRange(1, 10)); // Random number between 1-10
// console.log(clamp(15, 0, 10)); // 10
// console.log(lerp(0, 100, 0.5)); // 50
// console.log(mapRange(50, 0, 100, 0, 1)); // 0.5
// console.log(factorial(5)); // 120
// console.log(gcd(48, 18)); // 6
// console.log(lcm(12, 18)); // 36
// console.log(isPrime(17)); // true
// console.log(sum([1, 2, 3, 4, 5])); // 15
// console.log(average([1, 2, 3, 4, 5])); // 3
// console.log(median([1, 3, 5, 7, 9])); // 5
// console.log(mode([1, 2, 2, 3, 4, 4, 4])); // [4]
// console.log(standardDeviation([1, 2, 3, 4, 5])); // 1.414...
// console.log(degreesToRadians(180)); // 3.14159...
// console.log(distance(0, 0, 3, 4)); // 5
// console.log(formatNumber(1234567)); // "1,234,567"
// console.log(formatCurrency(1234.56)); // "$1,234.56"
// console.log(fibonacci(10)); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

module.exports = {
  roundTo,
  calculatePercentage,
  randomInRange,
  clamp,
  lerp,
  mapRange,
  factorial,
  gcd,
  lcm,
  isPrime,
  generatePrimes,
  sum,
  average,
  median,
  mode,
  standardDeviation,
  degreesToRadians,
  radiansToDegrees,
  distance,
  distance3D,
  formatNumber,
  formatCurrency,
  isWithinTolerance,
  fibonacci
};
