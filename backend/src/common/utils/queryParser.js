/**
 * Query Parser Utilities
 * Standardizes pagination, filtering, and sorting across all endpoints
 */

/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

/**
 * Parse pagination parameters from query string
 * Supports both offset-based (page/limit) and cursor-based pagination
 *
 * @param {Object} query - Express request query object
 * @returns {Object} Parsed pagination parameters
 */
const parsePagination = (query) => {
  const pagination = {
    type: 'offset', // 'offset' or 'cursor'
  };

  // Cursor-based pagination
  if (query.cursor) {
    pagination.type = 'cursor';
    pagination.cursor = query.cursor;
    pagination.limit = Math.min(
      Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, MIN_LIMIT),
      MAX_LIMIT,
    );
    return pagination;
  }

  // Offset-based pagination (default)
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, MIN_LIMIT),
    MAX_LIMIT,
  );

  pagination.page = page;
  pagination.limit = limit;
  pagination.skip = (page - 1) * limit;

  return pagination;
};

/**
 * Parse sorting parameters from query string
 * Format: ?sort=field1:asc,field2:desc or ?sort=-field1,field2
 *
 * @param {Object} query - Express request query object
 * @param {Array} allowedFields - List of allowed sort fields
 * @param {String} defaultSort - Default sort string
 * @returns {Object} MongoDB sort object
 */
const parseSorting = (query, allowedFields = [], defaultSort = '-createdAt') => {
  const sortStr = query.sort || defaultSort;
  const sortObj = {};

  if (!sortStr) {
    return sortObj;
  }

  const sortFields = sortStr.split(',');

  sortFields.forEach((field) => {
    let sortField = field.trim();
    let sortOrder = 1; // ascending by default

    // Handle minus prefix for descending
    if (sortField.startsWith('-')) {
      sortOrder = -1;
      sortField = sortField.substring(1);
    }

    // Handle colon notation (field:asc or field:desc)
    if (sortField.includes(':')) {
      const [fieldName, order] = sortField.split(':');
      sortField = fieldName;
      sortOrder = order.toLowerCase() === 'desc' ? -1 : 1;
    }

    // Validate against allowed fields if provided
    if (allowedFields.length === 0 || allowedFields.includes(sortField)) {
      sortObj[sortField] = sortOrder;
    }
  });

  return sortObj;
};

/**
 * Parse filtering parameters from query string
 * Supports various operators for flexible filtering
 *
 * Format examples:
 * - ?status=active (exact match)
 * - ?age[gte]=18 (greater than or equal)
 * - ?name[like]=john (contains, case-insensitive)
 * - ?tags[in]=fitness,nutrition (array contains)
 *
 * @param {Object} query - Express request query object
 * @param {Array} allowedFields - List of allowed filter fields
 * @param {Array} excludedParams - Parameters to exclude from filters
 * @returns {Object} MongoDB filter object
 */
const parseFilters = (
  query,
  allowedFields = [],
  excludedParams = ['page', 'limit', 'sort', 'cursor', 'fields'],
) => {
  const filters = {};

  Object.keys(query).forEach((key) => {
    // Skip excluded parameters
    if (excludedParams.includes(key)) {
      return;
    }

    // Skip if allowedFields is provided and field is not in the list
    if (allowedFields.length > 0 && !allowedFields.some((f) => key.startsWith(f))) {
      return;
    }

    const value = query[key];

    // Handle operator notation: field[operator]=value
    const operatorMatch = key.match(/^(.+)\[(.+)\]$/);

    if (operatorMatch) {
      const [, fieldName, operator] = operatorMatch;

      // Build MongoDB query based on operator
      switch (operator) {
        case 'eq': // Equal
          filters[fieldName] = value;
          break;
        case 'ne': // Not equal
          filters[fieldName] = { $ne: value };
          break;
        case 'gt': // Greater than
          filters[fieldName] = { ...filters[fieldName], $gt: parseValue(value) };
          break;
        case 'gte': // Greater than or equal
          filters[fieldName] = { ...filters[fieldName], $gte: parseValue(value) };
          break;
        case 'lt': // Less than
          filters[fieldName] = { ...filters[fieldName], $lt: parseValue(value) };
          break;
        case 'lte': // Less than or equal
          filters[fieldName] = { ...filters[fieldName], $lte: parseValue(value) };
          break;
        case 'in': // In array
          filters[fieldName] = { $in: value.split(',').map((v) => v.trim()) };
          break;
        case 'nin': // Not in array
          filters[fieldName] = { $nin: value.split(',').map((v) => v.trim()) };
          break;
        case 'like': // Contains (case-insensitive)
          filters[fieldName] = { $regex: value, $options: 'i' };
          break;
        case 'exists': // Field exists
          filters[fieldName] = { $exists: value === 'true' };
          break;
        default:
          // Unknown operator, treat as exact match
          filters[fieldName] = value;
      }
    } else {
      // No operator, exact match
      filters[key] = value;
    }
  });

  return filters;
};

/**
 * Parse field selection from query string
 * Format: ?fields=name,email,phone
 *
 * @param {Object} query - Express request query object
 * @returns {String} MongoDB projection string
 */
const parseFields = (query) => {
  if (!query.fields) {
    return '';
  }

  return query.fields.split(',').join(' ');
};

/**
 * Parse date range filters
 *
 * @param {Object} query - Express request query object
 * @param {String} fieldName - The date field name
 * @returns {Object} Date range filter or null
 */
const parseDateRange = (query, fieldName = 'createdAt') => {
  const startDate = query.startDate || query.from;
  const endDate = query.endDate || query.to;

  if (!startDate && !endDate) {
    return null;
  }

  const dateFilter = {};

  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }

  if (endDate) {
    dateFilter.$lte = new Date(endDate);
  }

  return { [fieldName]: dateFilter };
};

/**
 * Parse a value to its appropriate type
 *
 * @param {String} value - Value to parse
 * @returns {*} Parsed value
 */
const parseValue = (value) => {
  // Try to parse as number
  if (!isNaN(value) && value !== '') {
    return Number(value);
  }

  // Parse boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Parse null
  if (value === 'null') return null;

  // Return as string
  return value;
};

/**
 * Build full query options from request query
 * Combines pagination, sorting, filtering, and field selection
 *
 * @param {Object} query - Express request query object
 * @param {Object} options - Configuration options
 * @returns {Object} Complete query options
 */
const buildQueryOptions = (query, options = {}) => {
  const {
    allowedSortFields = [],
    allowedFilterFields = [],
    defaultSort = '-createdAt',
    excludedParams = ['page', 'limit', 'sort', 'cursor', 'fields'],
  } = options;

  return {
    pagination: parsePagination(query),
    sort: parseSorting(query, allowedSortFields, defaultSort),
    filters: parseFilters(query, allowedFilterFields, excludedParams),
    fields: parseFields(query),
  };
};

/**
 * Apply query options to a Mongoose query
 *
 * @param {Object} mongooseQuery - Mongoose query object
 * @param {Object} queryOptions - Parsed query options
 * @returns {Object} Modified Mongoose query
 */
const applyQueryOptions = (mongooseQuery, queryOptions) => {
  const { pagination, sort, fields } = queryOptions;

  // Apply sorting
  if (sort && Object.keys(sort).length > 0) {
    mongooseQuery = mongooseQuery.sort(sort);
  }

  // Apply field selection
  if (fields) {
    mongooseQuery = mongooseQuery.select(fields);
  }

  // Apply pagination
  if (pagination.type === 'offset') {
    mongooseQuery = mongooseQuery.skip(pagination.skip).limit(pagination.limit);
  } else if (pagination.type === 'cursor') {
    // Cursor-based pagination implementation
    if (pagination.cursor) {
      // Assuming cursor is the _id field
      mongooseQuery = mongooseQuery.where('_id').gt(pagination.cursor);
    }
    mongooseQuery = mongooseQuery.limit(pagination.limit);
  }

  return mongooseQuery;
};

module.exports = {
  parsePagination,
  parseSorting,
  parseFilters,
  parseFields,
  parseDateRange,
  parseValue,
  buildQueryOptions,
  applyQueryOptions,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_LIMIT,
};
