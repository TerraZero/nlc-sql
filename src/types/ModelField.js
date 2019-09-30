const SQL = require('../../index');
const Knex = require('knex');

module.exports = class ModelField {

  /**
   * @returns {Object<string, string>}
   */
  static define() {
    return {
      _: 'value',
      value: 'value',
    };
  }

  static get props() {
    return this.define();
  }

  /**
   * @param {Knex.CreateTableBuilder} table
   * @param {SQL.types.ModelField} field
   */
  static createSingle(table, field) {
    throw new SQL.errors.SQLTypeError('No implementation');
  }

  /**
   * @param {Knex.CreateTableBuilder} table
   * @param {SQL.types.ModelField} field
   */
  static createMulti(table, field) {
    throw new SQL.errors.SQLTypeError('No implementation');
  }

  /**
   * @param {Knex.CreateTableBuilder} table
   */
  static addMultiFields(table) {
    table.integer('reference');
    table.integer('delta');
    table.primary(['reference', 'delta']);
  }

  /**
   * @param {any} value
   * @param {SQL.types.ModelField} field
   * @returns {boolean}
   */
  static valid(value, field = null) {
    return true;
  }

  /**
   * @param {any} value
   * @param {Object} object
   * @param {SQL.types.ModelField} field
   * @returns {any}
   */
  static transform(value, object = {}, field = null) {
    if (typeof value === 'object') {
      for (const name in this.props) {
        if (name === '_') continue;
        object[name] = value[name] || object[name] || null;
      }
    } else {
      object[this.props._] = value;
    }
    return object;
  }

  /**
   * @param {string} name
   * @param {Object} options
   * @param {boolean} options.multi
   * @param {typeof SQL.Model} options.reference
   */
  static create(name, options = {}) {
    return {
      field: this,
      name: name,
      options: options,
    };
  }

  /**
   * @param {SQL.Model} entity
   * @param {SQL.types.ModelField} field
   * @return {Object<string, any>[]}
   */
  static sql(entity, field) {
    if (field.length() === 0) return null;
    const values = field.get();
    const data = [];

    for (const index in values) {
      const row = {
        reference: entity.id,
        delta: index,
      };

      for (const prop in this.props) {
        if (prop === '_' || this.props[prop] === null) continue;
        row[this.props[prop]] = values[index][this.props[prop]];
      }
      data.push(row);
    }
    return data;
  }

  /**
   * @param {SQL.FieldDefinition} definition
   * @param {SQL.Model} entity
   */
  constructor(definition, entity) {
    this._definition = definition;
    this._entity = entity;
    this._data = null;
  }

  /**
   * @returns {typeof SQL.types.ModelField}
   */
  get struct() {
    return this.constructor;
  }

  /**
   * @returns {SQL.FieldDefinition}
   */
  get definition() {
    return this._definition;
  }

  /**
   * @returns {SQL.Model}
   */
  get entity() {
    return this._entity;
  }

  /**
   * @param {any} value
   * @param {number} index
   * @returns {this}
   */
  set(value, index = 0) {
    this.entity._changed = true;
    if (Array.isArray(value)) {
      for (const i in value) {
        this.set(value[i], (index < 0 ? -1 : index + Number.parseInt(i)));
      }
    } else {
      if (!this.struct.valid(value, this)) throw new SQL.errors.SQLTypeError('No valid value');
      if (this.definition.options.multi) {
        this._data = this._data || [];
        if (index < 0 || index >= this._data.length) {
          this._data.push(this.struct.transform(value, {}, this));
        } else {
          this._data[index] = this.struct.transform(value, this._data[index], this);
        }
      } else {
        this._data = value;
      }
    }
    return this;
  }

  /**
   * @param {number} index
   * @param {string} prop
   * @returns {any}
   */
  get(index = null, prop = null) {
    if (index === null && prop === null || !this.definition.options.multi) return this._data;
    if (prop === null) return this._data[index];
    if (index === null) {
      const values = [];

      for (const value of this._data) {
        values.push(value[this.struct.props[prop]]);
      }
      return values;
    }
    return this._data[index][prop];
  }

  /**
   * @returns {this}
   */
  clear() {
    this.entity._changed = true;
    this._data = null;
    return this;
  }

  /**
   * @returns {number}
   */
  length() {
    if (!this._data) return 0;
    if (this.definition.options.multi) {
      return this._data.length;
    } else {
      return 1;
    }
  }

}
