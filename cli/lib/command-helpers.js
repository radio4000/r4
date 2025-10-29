/**
 * Shared utilities for CLI commands
 */

/**
 * Normalize a value to an array
 * @param {*} value - Single value or array
 * @returns {Array} Normalized array
 */
export function toArray(value) {
	return Array.isArray(value) ? value : [value]
}

/**
 * Return single item if array has one element, otherwise return full array
 * @param {*} items - Array to process
 * @returns {*} Single item or array
 */
export function singleOrMultiple(items) {
	return items.length === 1 ? items[0] : items
}

/**
 * Validate that at least one update field is provided
 * @param {Object} updates - Update object to validate
 * @throws {Error} If updates object is empty
 */
export function requireUpdates(updates) {
	if (Object.keys(updates).length === 0) {
		throw new Error('At least one field must be provided for update')
	}
}

/**
 * Format command result with standardized output structure
 * @param {*} data - Data to return
 * @param {string} format - Output format (json, text, sql, etc.)
 * @param {string} tableName - Table name for SQL format
 * @param {Object} options - Additional options
 * @param {boolean} options.asSingle - If true, unwrap single-item arrays
 * @returns {Object} Formatted result object {data, format, formatOptions}
 */
export function formatResult(data, format, tableName, options = {}) {
	const {asSingle = false} = options
	return {
		data: asSingle ? singleOrMultiple(data) : data,
		format: format || 'json',
		formatOptions: format === 'sql' ? {table: tableName} : undefined
	}
}
