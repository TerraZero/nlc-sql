import SQLTypeError from 'nlc-sql/src/errors/SQLTypeError';



export default class ModelField {

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
   * @param {import('knex').CreateTableBuilder} table
   * @param {ModelField} field
   */
  static createSingle(table, field) {
    throw new SQLTypeError('No implementation');
  }

  /**
   * @param {import('knex').CreateTableBuilder} table
   * @param {ModelField} field
   */
  static createMulti(table, field) {
    throw new SQLTypeError('No implementation');
  }

  /**
   * @param {import('knex').CreateTableBuilder} table
   */
  static addMultiFields(table) {
    table.integer('reference');
    table.integer('delta');
    table.primary(['reference', 'delta']);
  }

  /**
   * @param {any} value
   * @param {ModelField} field
   * @returns {boolean}
   */
  static valid(value, field = null) {
    return true;
  }

  /**
   * @param {any} value
   * @param {Object} object
   * @param {ModelField} field
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
   * @param {string} options.reference
   */
  static create(name, options = {}) {
    return {
      field: this,
      name: name,
      options: options,
    };
  }

  /**
   * @param {import('nlc-sql/src/Model').default} entity
   * @param {ModelField} field
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
   * @param {T_FieldDefinition} definition
   * @param {import('nlc-sql/src/Model').default} entity
   */
  constructor(definition, entity) {
    this._definition = definition;
    this._entity = entity;
    this._data = null;
  }

  /**
   * @returns {typeof ModelField}
   */
  get struct() {
    return this.constructor;
  }

  /**
   * @returns {T_FieldDefinition}
   */
  get definition() {
    return this._definition;
  }

  /**
   * @returns {import('nlc-sql/src/Model').default}
   */
  get entity() {
    return this._entity;
  }

  /**
   * @param {any} value
   * @param {boolean} error
   * @returns {boolean}
   */
  isValidValue(value, error = true) {
    if (this.definition.options.multi) {
      if (!Array.isArray(value)) value = [value];

      for (const item of value) {
        if (!this.struct.valid(item, this)) {
          if (error) {
            throw new SQLTypeError('The value :value is not valid for field :field', {
              ':value': item,
              ':field': this.definition.name,
            });
          } else {
            return false;
          }
        }
      }
    } else {
      if (!this.struct.valid(value, this)) {
        if (error) {
          throw new SQLTypeError('The value :value is not valid for field :field', {
            ':value': value,
            ':field': this.definition.name,
          });
        } else {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * @param {any} value
   * @param {number|null} index
   * @returns {this}
   */
  set(value, index = null) {
    this.isValidValue(value);
    this.entity._changed = true;
    if (index === null) {
      this._data = null;
    }

    if (Array.isArray(value)) {
      for (const i in value) {
        this.set(value[i], (index < 0 ? -1 : index + Number.parseInt(i)));
      }
    } else {
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
        values.push(this.load(value, prop));
      }
      return values;
    }
    return this.load(this._data[index], prop);
  }

  /**
   * @param {any} value
   * @param {string} prop
   * @returns {any}
   */
  async load(value, prop = null) {
    return value[this.struct.props[prop]];
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
