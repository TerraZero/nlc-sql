/**
 * @typedef {Object} FieldDefinition
 * @property {typeof import('./src/types/ModelField')} field
 * @property {string} name
 * @property {Object} options
 * @property {boolean} options.multi
 * @property {typeof import('./src/Model')} options.reference
 */

/**
 * @typedef {Object} EntityKey
 * @property {string} type
 * @property {number} id
 */

/**
 * @typedef {Object} SQLModelDefinition
 * @property {string} path
 * @property {string} models
 */

/**
 * @typedef {Object} SQLDefinition
 * @property {SQLModelDefinition[]} models
 * @property {string} storage
 * @property {Object} definition
 * @property {string} definition.dialect
 * @property {Object} definition.connection
 */

module.exports.errors = {};
module.exports.errors.SQLError = require('./src/errors/SQLError');
module.exports.errors.SQLTypeError = require('./src/errors/SQLTypeError');

module.exports.types = {};
module.exports.types.ModelField = require('./src/types/ModelField');
module.exports.types.StringField = require('./src/types/StringField');
module.exports.types.NumberField = require('./src/types/NumberField');
module.exports.types.IDField = require('./src/types/IDField');
module.exports.types.ReferenceField = require('./src/types/ReferenceField');

module.exports.Knex = require('knex');
module.exports.Manager = require('./src/Manager');
module.exports.Model = require('./src/Model');
module.exports.Storage = require('./src/Storage');
module.exports.Connection = require('./src/Connection');

let manager = null;
/**
 * @returns {import('./src/Manager')}
 */
module.exports.get = function get() {
  if (manager === null) {
    manager = require('nlc').get().service('sql.manager');
  }
  return manager;
};
