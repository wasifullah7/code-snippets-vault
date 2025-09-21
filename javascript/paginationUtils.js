/**
 * Pagination utilities for data handling
 */

/**
 * Paginate array data
 * @param {Array} data - Data array to paginate
 * @param {number} page - Current page (1-based)
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination result
 */
export const paginateArray = (data, page = 1, pageSize = 10) => {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      previousPage: currentPage > 1 ? currentPage - 1 : null,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    }
  };
};

/**
 * Generate pagination links
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total pages
 * @param {Object} options - Options
 * @returns {Array} Pagination links
 */
export const generatePaginationLinks = (currentPage, totalPages, options = {}) => {
  const {
    maxVisible = 5,
    showFirstLast = true,
    showPrevNext = true,
    ellipsis = '...'
  } = options;

  const links = [];
  const halfVisible = Math.floor(maxVisible / 2);
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, currentPage + halfVisible);

  // Adjust range if near beginning or end
  if (currentPage <= halfVisible) {
    endPage = Math.min(totalPages, maxVisible);
  }
  if (currentPage > totalPages - halfVisible) {
    startPage = Math.max(1, totalPages - maxVisible + 1);
  }

  // First page
  if (showFirstLast && startPage > 1) {
    links.push({
      page: 1,
      type: 'first',
      label: 'First',
      active: false,
      disabled: false
    });
  }

  // Previous page
  if (showPrevNext && currentPage > 1) {
    links.push({
      page: currentPage - 1,
      type: 'previous',
      label: 'Previous',
      active: false,
      disabled: false
    });
  }

  // Left ellipsis
  if (startPage > 1) {
    links.push({
      page: null,
      type: 'ellipsis',
      label: ellipsis,
      active: false,
      disabled: true
    });
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    links.push({
      page: i,
      type: 'page',
      label: i.toString(),
      active: i === currentPage,
      disabled: false
    });
  }

  // Right ellipsis
  if (endPage < totalPages) {
    links.push({
      page: null,
      type: 'ellipsis',
      label: ellipsis,
      active: false,
      disabled: true
    });
  }

  // Next page
  if (showPrevNext && currentPage < totalPages) {
    links.push({
      page: currentPage + 1,
      type: 'next',
      label: 'Next',
      active: false,
      disabled: false
    });
  }

  // Last page
  if (showFirstLast && endPage < totalPages) {
    links.push({
      page: totalPages,
      type: 'last',
      label: 'Last',
      active: false,
      disabled: false
    });
  }

  return links;
};

/**
 * Calculate offset from page and page size
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Items per page
 * @returns {number} Offset value
 */
export const calculateOffset = (page, pageSize) => {
  return (page - 1) * pageSize;
};

/**
 * Calculate page from offset and page size
 * @param {number} offset - Offset value
 * @param {number} pageSize - Items per page
 * @returns {number} Page number (1-based)
 */
export const calculatePage = (offset, pageSize) => {
  return Math.floor(offset / pageSize) + 1;
};

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validated parameters
 */
export const validatePaginationParams = (params) => {
  const {
    page = 1,
    pageSize = 10,
    maxPageSize = 100,
    minPageSize = 1
  } = params;

  const validatedPage = Math.max(1, Math.floor(page));
  const validatedPageSize = Math.max(
    minPageSize,
    Math.min(maxPageSize, Math.floor(pageSize))
  );

  return {
    page: validatedPage,
    pageSize: validatedPageSize
  };
};

/**
 * Create pagination info object
 * @param {number} totalItems - Total number of items
 * @param {number} currentPage - Current page
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination info
 */
export const createPaginationInfo = (totalItems, currentPage, pageSize) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return {
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    startItem,
    endItem,
    showing: `${startItem}-${endItem} of ${totalItems}`,
    hasItems: totalItems > 0,
    isEmpty: totalItems === 0
  };
};

/**
 * Infinite scroll pagination helper
 * @param {Array} allData - All data
 * @param {number} loadedItems - Number of items already loaded
 * @param {number} pageSize - Items to load per batch
 * @returns {Object} Infinite scroll result
 */
export const getInfiniteScrollData = (allData, loadedItems = 0, pageSize = 20) => {
  const totalItems = allData.length;
  const nextBatch = allData.slice(loadedItems, loadedItems + pageSize);
  const hasMore = loadedItems + pageSize < totalItems;
  const nextLoadedItems = loadedItems + nextBatch.length;

  return {
    data: nextBatch,
    loadedItems: nextLoadedItems,
    hasMore,
    totalItems,
    progress: Math.round((nextLoadedItems / totalItems) * 100)
  };
};

/**
 * Cursor-based pagination
 * @param {Array} data - Data array
 * @param {string} cursorField - Field to use as cursor
 * @param {string} cursor - Current cursor value
 * @param {number} limit - Number of items to return
 * @param {string} direction - Direction (next, previous)
 * @returns {Object} Cursor pagination result
 */
export const paginateWithCursor = (data, cursorField, cursor, limit = 10, direction = 'next') => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      data: [],
      nextCursor: null,
      previousCursor: null,
      hasNext: false,
      hasPrevious: false
    };
  }

  // Sort data by cursor field
  const sortedData = [...data].sort((a, b) => {
    const aVal = a[cursorField];
    const bVal = b[cursorField];
    return direction === 'next' ? aVal - bVal : bVal - aVal;
  });

  let startIndex = 0;
  if (cursor) {
    startIndex = sortedData.findIndex(item => item[cursorField] === cursor);
    if (startIndex !== -1) {
      startIndex += direction === 'next' ? 1 : -1;
    }
  }

  const endIndex = Math.min(startIndex + limit, sortedData.length);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const nextCursor = paginatedData.length > 0 && endIndex < sortedData.length
    ? paginatedData[paginatedData.length - 1][cursorField]
    : null;

  const previousCursor = startIndex > 0 && paginatedData.length > 0
    ? paginatedData[0][cursorField]
    : null;

  return {
    data: paginatedData,
    nextCursor,
    previousCursor,
    hasNext: endIndex < sortedData.length,
    hasPrevious: startIndex > 0
  };
};

/**
 * Pagination state manager
 */
export class PaginationManager {
  constructor(options = {}) {
    this.currentPage = options.initialPage || 1;
    this.pageSize = options.pageSize || 10;
    this.totalItems = options.totalItems || 0;
    this.maxVisiblePages = options.maxVisiblePages || 5;
    this.listeners = new Set();
  }

  /**
   * Get current pagination state
   * @returns {Object} Current state
   */
  getState() {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    return {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      totalItems: this.totalItems,
      totalPages,
      hasNextPage: this.currentPage < totalPages,
      hasPreviousPage: this.currentPage > 1,
      paginationInfo: createPaginationInfo(this.totalItems, this.currentPage, this.pageSize),
      links: generatePaginationLinks(this.currentPage, totalPages, {
        maxVisible: this.maxVisiblePages
      })
    };
  }

  /**
   * Go to specific page
   * @param {number} page - Page number
   */
  goToPage(page) {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    const newPage = Math.max(1, Math.min(page, totalPages));
    
    if (newPage !== this.currentPage) {
      this.currentPage = newPage;
      this.notifyListeners();
    }
  }

  /**
   * Go to next page
   */
  nextPage() {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.notifyListeners();
    }
  }

  /**
   * Go to previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.notifyListeners();
    }
  }

  /**
   * Go to first page
   */
  firstPage() {
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      this.notifyListeners();
    }
  }

  /**
   * Go to last page
   */
  lastPage() {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    if (this.currentPage !== totalPages) {
      this.currentPage = totalPages;
      this.notifyListeners();
    }
  }

  /**
   * Change page size
   * @param {number} newPageSize - New page size
   */
  setPageSize(newPageSize) {
    if (newPageSize !== this.pageSize) {
      this.pageSize = newPageSize;
      // Adjust current page if it's now beyond total pages
      const totalPages = Math.ceil(this.totalItems / this.pageSize);
      this.currentPage = Math.min(this.currentPage, totalPages);
      this.notifyListeners();
    }
  }

  /**
   * Update total items
   * @param {number} totalItems - Total number of items
   */
  setTotalItems(totalItems) {
    if (totalItems !== this.totalItems) {
      this.totalItems = totalItems;
      // Adjust current page if it's now beyond total pages
      const totalPages = Math.ceil(this.totalItems / this.pageSize);
      this.currentPage = Math.min(this.currentPage, totalPages);
      this.notifyListeners();
    }
  }

  /**
   * Reset pagination
   */
  reset() {
    this.currentPage = 1;
    this.notifyListeners();
  }

  /**
   * Add state change listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove state change listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Pagination listener error:', error);
      }
    });
  }

  /**
   * Destroy pagination manager
   */
  destroy() {
    this.listeners.clear();
  }
}
