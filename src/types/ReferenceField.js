const SQL = require('../../index');
const Knex = require('knex');

module.exports = class ReferenceField extends SQL.types.ModelField {

  /**
   * @returns {Object<string, string>}
   */
  static define() {
    return {
      _: 'value',
      type: 'type',
      value: 'value',
      entity: null,
    };
  }

  /**
   * @param {Knex.CreateTableBuilder} table
   * @param {SQL.types.ModelField} field
   */
  static createMulti(table, field) {
    this.addMultiFields(table);
    table.string('type');
    table.integer('value');
  }

  /**
   * @param {any} value
   * @param {Object} object
   * @param {SQL.types.ModelField} field
   * @returns {any}
   */
  static transform(value, object = {}, field = null) {
    if (value instanceof SQL.Model) {
      if (value.struct.name === field.definition.options.reference) {
        if (value.isNew) {
          return {
            value: null,
            type: null,
            entity: value,
          };
        } else {
          value = {
            value: value.id,
            type: value.struct.name,
            entity: value,
          };
        }
      } else {
        throw new SQL.errors.SQLTypeError('Wrong entity type');
      }
    }

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

      if (values[index].entity !== null) {
        row.value = values[index].entity.id;
        row.type = values[index].entity.struct.name;
      }
      data.push(row);
    }
    return data;
  }

}
