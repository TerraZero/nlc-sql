const SQL = require('../index');

module.exports = class Model {

  /**
   * @returns {SQL.FieldDefinition[]}
   */
  static define() {
    throw new SQL.errors.SQLError('No fields defined for model');
  }

  /**
   * @returns {Map<string, SQL.FieldDefinition>}
   */
  static get fields() {
    if (this._fields === undefined) {
      this._fields = new Map();
      for (const field of this.define()) {
        this._fields.set(field.name, field);
      }
    }
    return this._fields;
  }

  /**
   * @returns {string}
   */
  static get name() {
    return '';
  }

  /**
   * @param {Object} data
   * @returns {SQL.Model}
   */
  static create(data) {
    return new this(data);
  }

  constructor(data = {}) {
    this._fields = new Map();
    for (const [name, definition] of this.struct.fields) {
      this._fields.set(name, new definition.field(definition, this));
    }

    for (const field in data) {
      this.set(field, data[field]);
    }
    this._changed = false;
  }

  /**
   * @returns {typeof SQL.Model}
   */
  get struct() {
    return this.constructor;
  }

  /**
   * @returns {Map<string, SQL.types.ModelField>}
   */
  get fields() {
    return this._fields;
  }

  /**
   * @returns {number}
   */
  get id() {
    return Number.parseInt(this.get('id'));
  }

  /**
   * @returns {boolean}
   */
  get isNew() {
    return Number.isNaN(this.id);
  }

  /**
   * @returns {Object<string, any>}
   */
  get sql() {
    const data = {};

    for (const [name, field] of this.fields) {
      if (!field.definition.options.multi && field.length() !== 0) {
        data[name] = field.get();
      }
    }
    return data;
  }

  /**
   * @param {string} field
   * @param {any} value
   * @param {number} index
   * @returns {this}
   */
  set(field, value, index = 0) {
    this.fields.get(field).set(value, index);
    return this;
  }

  /**
   * @param {string} field
   * @param {number} index
   * @param {string} prop
   * @returns {any}
   */
  get(field, index = null, prop = null) {
    return this.fields.get(field).get(index, prop);
  }

  /**
   * @param {string} field
   */
  clear(field) {
    this.fields.get(field).clear();
  }

}
