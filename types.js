/**
 * @typedef {Object} T_FieldDefinition
 * @property {typeof import('nlc-sql/src/types/ModelField').default} field
 * @property {string} name The name of the field inside of the entity
 * @property {Object} options
 * @property {boolean} options.multi
 * @property {string} options.reference
 */

/**
 * @typedef {Object} T_EntityKey
 * @property {string} type
 * @property {number} id
 */

/**
 * @typedef {Object} T_SQLModelDefinition
 * @property {string} path
 * @property {string} models
 */

/**
 * @typedef {Object} T_MYSQL
 * @property {string} client
 * @property {string} version
 * @property {Object} connection
 * @property {string} connection.host
 * @property {string} connection.user
 * @property {string} connection.password
 * @property {string} connection.database
 */

/**
 * @typedef {Object} T_SQLITE3
 * @property {string} client
 * @property {Object} connection
 * @property {string} connection.filename
 * @property {boolean} useNullAsDefault
 */

/**
 * @typedef {Object} T_SQLDefinition
 * @property {(T_MYSQL|T_SQLITE3)} target
 * @property {string} storage
 * @property {(string|string[])} models
 */
