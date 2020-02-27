import 'nlc-sql/types';
import SQLError from 'nlc-sql/src/errors/SQLError';



export default class Model {

  /**
   * @returns {T_FieldDefinition[]}
   */
  static define() {
    throw new SQLError('No fields defined for model');
  }

  /**
   * @returns {Map<string, T_FieldDefinition>}
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
   * @param {Model} data
   */
  static create(data) {
    return new this(data);
  }

  constructor(data = {}) {
    /** @type {import('nlc-sql/src/SQLManager').default} */
    this._manager = NLC.service('nlc.sql');
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
   * @returns {typeof Model}
   */
  get struct() {
    return this.constructor;
  }

  /**
   * @returns {Map<string, import('nlc-sql/src/types/ModelField').default>}
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
   * index null - for replace current value
   * index -1 - to add another item (multi only)
   * index [number] - to overwrite on a defined point (multi only)
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

  toString() {
    return (this.struct.model !== undefined ? this.struct.model : this.struct.name.toLowerCase()) + '[' + (this.isNew ? '#' : this.id) + ']';
  }

}
