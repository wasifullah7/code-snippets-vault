/**
 * Chart and data visualization utilities
 */

/**
 * Generate simple bar chart data
 * @param {Array} data - Data array
 * @param {Object} options - Chart options
 * @returns {Object} Chart configuration
 */
export const createBarChart = (data, options = {}) => {
  const {
    width = 400,
    height = 300,
    margin = { top: 20, right: 20, bottom: 40, left: 40 },
    colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    showValues = true,
    orientation = 'vertical' // vertical or horizontal
  } = options;

  const maxValue = Math.max(...data.map(item => item.value));
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  return {
    type: 'bar',
    orientation,
    width,
    height,
    margin,
    data: data.map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
      width: orientation === 'vertical' 
        ? (item.value / maxValue) * chartWidth 
        : chartWidth / data.length,
      height: orientation === 'vertical'
        ? chartHeight / data.length
        : (item.value / maxValue) * chartHeight,
      x: orientation === 'vertical' 
        ? margin.left 
        : margin.left + (index * chartWidth / data.length),
      y: orientation === 'vertical'
        ? margin.top + (index * chartHeight / data.length)
        : margin.top + chartHeight - ((item.value / maxValue) * chartHeight)
    })),
    maxValue,
    config: {
      showValues,
      colors,
      orientation
    }
  };
};

/**
 * Generate line chart data
 * @param {Array} data - Data array with x, y coordinates
 * @param {Object} options - Chart options
 * @returns {Object} Chart configuration
 */
export const createLineChart = (data, options = {}) => {
  const {
    width = 400,
    height = 300,
    margin = { top: 20, right: 20, bottom: 40, left: 40 },
    color = '#3b82f6',
    strokeWidth = 2,
    showDots = true,
    smooth = false
  } = options;

  const xValues = data.map(point => point.x);
  const yValues = data.map(point => point.y);
  
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const scaleX = (value) => margin.left + ((value - minX) / (maxX - minX)) * chartWidth;
  const scaleY = (value) => margin.top + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

  const scaledData = data.map(point => ({
    ...point,
    scaledX: scaleX(point.x),
    scaledY: scaleY(point.y)
  }));

  // Generate path for line
  const pathData = scaledData.map((point, index) => {
    const command = index === 0 ? 'M' : smooth ? 'Q' : 'L';
    return `${command} ${point.scaledX} ${point.scaledY}`;
  }).join(' ');

  return {
    type: 'line',
    width,
    height,
    margin,
    data: scaledData,
    pathData,
    color,
    strokeWidth,
    showDots,
    smooth,
    scales: {
      x: { min: minX, max: maxX, scale: scaleX },
      y: { min: minY, max: maxY, scale: scaleY }
    },
    config: {
      color,
      strokeWidth,
      showDots,
      smooth
    }
  };
};

/**
 * Generate pie chart data
 * @param {Array} data - Data array with label and value
 * @param {Object} options - Chart options
 * @returns {Object} Chart configuration
 */
export const createPieChart = (data, options = {}) => {
  const {
    width = 400,
    height = 400,
    radius = Math.min(width, height) / 2 - 20,
    colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
    showLabels = true,
    showPercentages = true,
    centerX = width / 2,
    centerY = height / 2
  } = options;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const pieData = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    currentAngle += angle;

    // Calculate arc path
    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'Z'
    ].join(' ');

    // Calculate label position
    const labelAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    return {
      ...item,
      color: colors[index % colors.length],
      percentage: Math.round(percentage * 10) / 10,
      startAngle,
      endAngle,
      angle,
      pathData,
      labelX,
      labelY
    };
  });

  return {
    type: 'pie',
    width,
    height,
    radius,
    centerX,
    centerY,
    data: pieData,
    total,
    config: {
      colors,
      showLabels,
      showPercentages
    }
  };
};

/**
 * Generate scatter plot data
 * @param {Array} data - Data array with x, y coordinates
 * @param {Object} options - Chart options
 * @returns {Object} Chart configuration
 */
export const createScatterPlot = (data, options = {}) => {
  const {
    width = 400,
    height = 300,
    margin = { top: 20, right: 20, bottom: 40, left: 40 },
    color = '#3b82f6',
    radius = 4,
    showTrendLine = false,
    showGrid = true
  } = options;

  const xValues = data.map(point => point.x);
  const yValues = data.map(point => point.y);
  
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const scaleX = (value) => margin.left + ((value - minX) / (maxX - minX)) * chartWidth;
  const scaleY = (value) => margin.top + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

  const scaledData = data.map(point => ({
    ...point,
    scaledX: scaleX(point.x),
    scaledY: scaleY(point.y)
  }));

  // Calculate trend line if requested
  let trendLine = null;
  if (showTrendLine && data.length > 1) {
    const n = data.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = data.reduce((sum, point) => sum + (point.x * point.y), 0);
    const sumXX = xValues.reduce((sum, x) => sum + (x * x), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const trendStartX = scaleX(minX);
    const trendEndX = scaleX(maxX);
    const trendStartY = scaleY(slope * minX + intercept);
    const trendEndY = scaleY(slope * maxX + intercept);
    
    trendLine = {
      startX: trendStartX,
      startY: trendStartY,
      endX: trendEndX,
      endY: trendEndY,
      equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
      rSquared: calculateRSquared(data, slope, intercept)
    };
  }

  return {
    type: 'scatter',
    width,
    height,
    margin,
    data: scaledData,
    color,
    radius,
    trendLine,
    showGrid,
    scales: {
      x: { min: minX, max: maxX, scale: scaleX },
      y: { min: minY, max: maxY, scale: scaleY }
    },
    config: {
      color,
      radius,
      showTrendLine,
      showGrid
    }
  };
};

/**
 * Calculate R-squared value for trend line
 * @param {Array} data - Data points
 * @param {number} slope - Line slope
 * @param {number} intercept - Line intercept
 * @returns {number} R-squared value
 */
const calculateRSquared = (data, slope, intercept) => {
  const yValues = data.map(point => point.y);
  const meanY = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
  
  const ssRes = data.reduce((sum, point) => {
    const predicted = slope * point.x + intercept;
    return sum + Math.pow(point.y - predicted, 2);
  }, 0);
  
  const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  
  return 1 - (ssRes / ssTot);
};

/**
 * Generate chart colors
 * @param {number} count - Number of colors needed
 * @param {string} type - Color type (default: 'blue')
 * @returns {Array} Color array
 */
export const generateChartColors = (count, type = 'blue') => {
  const colorSchemes = {
    blue: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a', '#312e81'],
    red: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
    green: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
    purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'],
    orange: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
    teal: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'],
    rainbow: ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
  };
  
  const scheme = colorSchemes[type] || colorSchemes.blue;
  
  if (count <= scheme.length) {
    return scheme.slice(0, count);
  }
  
  // Generate additional colors if needed
  const colors = [...scheme];
  while (colors.length < count) {
    const hue = (colors.length * 137.5) % 360; // Golden angle
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  
  return colors;
};

/**
 * Format chart data for display
 * @param {Array} data - Raw data
 * @param {Object} options - Formatting options
 * @returns {Array} Formatted data
 */
export const formatChartData = (data, options = {}) => {
  const {
    xFormatter = (x) => x,
    yFormatter = (y) => y,
    labelFormatter = (label) => label,
    sortBy = null,
    groupBy = null,
    aggregate = 'sum'
  } = options;

  let formattedData = data.map(item => ({
    ...item,
    x: xFormatter(item.x),
    y: yFormatter(item.y),
    label: labelFormatter(item.label),
    value: item.value || item.y
  }));

  // Group data if needed
  if (groupBy) {
    const groups = {};
    formattedData.forEach(item => {
      const key = item[groupBy];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    formattedData = Object.entries(groups).map(([key, items]) => {
      let aggregatedValue;
      switch (aggregate) {
        case 'sum':
          aggregatedValue = items.reduce((sum, item) => sum + item.value, 0);
          break;
        case 'avg':
          aggregatedValue = items.reduce((sum, item) => sum + item.value, 0) / items.length;
          break;
        case 'max':
          aggregatedValue = Math.max(...items.map(item => item.value));
          break;
        case 'min':
          aggregatedValue = Math.min(...items.map(item => item.value));
          break;
        default:
          aggregatedValue = items.reduce((sum, item) => sum + item.value, 0);
      }

      return {
        [groupBy]: key,
        value: aggregatedValue,
        items: items
      };
    });
  }

  // Sort data if needed
  if (sortBy) {
    formattedData.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
    });
  }

  return formattedData;
};

/**
 * Calculate chart statistics
 * @param {Array} data - Chart data
 * @returns {Object} Statistics
 */
export const calculateChartStats = (data) => {
  const values = data.map(item => item.value || item.y);
  
  if (values.length === 0) {
    return { count: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    count: values.length,
    sum,
    mean: Math.round(mean * 100) / 100,
    median: sorted[Math.floor(sorted.length / 2)],
    min: Math.min(...values),
    max: Math.max(...values),
    range: Math.max(...values) - Math.min(...values),
    variance: Math.round(variance * 100) / 100,
    standardDeviation: Math.round(stdDev * 100) / 100
  };
};
