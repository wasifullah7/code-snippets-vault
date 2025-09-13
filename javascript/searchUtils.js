/**
 * Search and filtering utility functions
 */

/**
 * Simple text search with highlighting
 * @param {string} text - Text to search in
 * @param {string} query - Search query
 * @param {boolean} caseSensitive - Case sensitive search
 * @returns {Object} Search result with matches and highlighted text
 */
export const searchText = (text, query, caseSensitive = false) => {
  if (!query.trim()) {
    return { matches: 0, highlightedText: text, positions: [] };
  }
  
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  
  const positions = [];
  let index = searchText.indexOf(searchQuery);
  
  while (index !== -1) {
    positions.push({ start: index, end: index + query.length });
    index = searchText.indexOf(searchQuery, index + 1);
  }
  
  // Create highlighted text
  let highlightedText = text;
  positions.reverse().forEach(pos => {
    const before = highlightedText.slice(0, pos.start);
    const match = highlightedText.slice(pos.start, pos.end);
    const after = highlightedText.slice(pos.end);
    highlightedText = `${before}<mark>${match}</mark>${after}`;
  });
  
  return {
    matches: positions.length,
    highlightedText,
    positions
  };
};

/**
 * Fuzzy search implementation
 * @param {string} text - Text to search in
 * @param {string} query - Search query
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Object} Fuzzy search result
 */
export const fuzzySearch = (text, query, threshold = 0.6) => {
  const similarity = calculateSimilarity(text.toLowerCase(), query.toLowerCase());
  
  return {
    text,
    query,
    similarity,
    matches: similarity >= threshold,
    score: Math.round(similarity * 100)
  };
};

/**
 * Calculate string similarity using Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
export const calculateSimilarity = (str1, str2) => {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Initialize matrix
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const distance = matrix[len2][len1];
  const maxLength = Math.max(len1, len2);
  
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
};

/**
 * Search array of objects by property
 * @param {Array} array - Array to search
 * @param {string} property - Property to search in
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Array} Filtered results
 */
export const searchByProperty = (array, property, query, options = {}) => {
  const { caseSensitive = false, fuzzy = false, threshold = 0.6 } = options;
  
  if (!query.trim()) return array;
  
  return array.filter(item => {
    const value = String(item[property] || '');
    
    if (fuzzy) {
      return fuzzySearch(value, query, threshold).matches;
    } else {
      const searchValue = caseSensitive ? value : value.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();
      return searchValue.includes(searchQuery);
    }
  });
};

/**
 * Multi-property search
 * @param {Array} array - Array to search
 * @param {Array} properties - Properties to search in
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Array} Filtered results
 */
export const searchMultipleProperties = (array, properties, query, options = {}) => {
  const { caseSensitive = false, fuzzy = false, threshold = 0.6 } = options;
  
  if (!query.trim()) return array;
  
  return array.filter(item => {
    return properties.some(property => {
      const value = String(item[property] || '');
      
      if (fuzzy) {
        return fuzzySearch(value, query, threshold).matches;
      } else {
        const searchValue = caseSensitive ? value : value.toLowerCase();
        const searchQuery = caseSensitive ? query : query.toLowerCase();
        return searchValue.includes(searchQuery);
      }
    });
  });
};

/**
 * Advanced search with filters
 * @param {Array} array - Array to search
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered results
 */
export const advancedSearch = (array, filters) => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, filter]) => {
      const value = item[key];
      
      if (filter === null || filter === undefined) {
        return true;
      }
      
      // String search
      if (typeof filter === 'string') {
        return String(value).toLowerCase().includes(filter.toLowerCase());
      }
      
      // Array search (any match)
      if (Array.isArray(filter)) {
        return filter.some(f => String(value).toLowerCase().includes(String(f).toLowerCase()));
      }
      
      // Range search
      if (typeof filter === 'object' && (filter.min !== undefined || filter.max !== undefined)) {
        const numValue = Number(value);
        if (filter.min !== undefined && numValue < filter.min) return false;
        if (filter.max !== undefined && numValue > filter.max) return false;
        return true;
      }
      
      // Exact match
      return value === filter;
    });
  });
};

/**
 * Sort search results by relevance
 * @param {Array} results - Search results
 * @param {string} query - Original search query
 * @param {string} property - Property to rank by
 * @returns {Array} Sorted results
 */
export const rankByRelevance = (results, query, property) => {
  return results.sort((a, b) => {
    const scoreA = calculateSimilarity(String(a[property] || '').toLowerCase(), query.toLowerCase());
    const scoreB = calculateSimilarity(String(b[property] || '').toLowerCase(), query.toLowerCase());
    return scoreB - scoreA;
  });
};

/**
 * Create search index for faster searching
 * @param {Array} data - Data to index
 * @param {Array} properties - Properties to index
 * @returns {Object} Search index
 */
export const createSearchIndex = (data, properties) => {
  const index = {};
  
  data.forEach((item, itemIndex) => {
    properties.forEach(property => {
      const value = String(item[property] || '').toLowerCase();
      const words = value.split(/\s+/);
      
      words.forEach(word => {
        if (!index[word]) {
          index[word] = new Set();
        }
        index[word].add(itemIndex);
      });
    });
  });
  
  return {
    data,
    index,
    search: (query) => {
      const words = query.toLowerCase().split(/\s+/);
      const resultIndices = new Set();
      
      words.forEach(word => {
        Object.keys(index).forEach(indexWord => {
          if (indexWord.includes(word)) {
            index[indexWord].forEach(index => resultIndices.add(index));
          }
        });
      });
      
      return Array.from(resultIndices).map(index => data[index]);
    }
  };
};
