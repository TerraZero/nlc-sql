import ModelField from 'nlc-sql/src/types/ModelField';
import Model from 'nlc-sql/src/Model';



export default class ReferenceField extends ModelField {

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
   * @param {import('Knex').CreateTableBuilder} table
   * @param {ModelField} field
   */
  static createMulti(table, field) {
    this.addMultiFields(table);
    table.string('type');
    table.integer('value');
  }

  /**
   * @param {any} value
   * @param {Object} object
   * @param {ModelField} field
   * @returns {any}
   */
  static transform(value, object = {}, field = null) {
    if (value instanceof field.entity._manager.getModel(field.definition.options.reference)) {
      if (value.isNew) {
        return {
          value: null,
          type: null,
          entity: value,
        };
      } else {
        value = {
          value: value.id,
          type: value.struct.model,
          entity: value,
        };
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
   * @param {Model} entity
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

      if (values[index].entity !== null) {
        row.value = values[index].entity.id;
        row.type = values[index].entity.struct.model;
      }
      data.push(row);
    }
    return data;
  }

  async getEntity(index = null) {
    if (index === null) {
      const values = [];
      for (const i in this._data) {
        values.push(await this.getEntity(i));
      }
      return values;
    }
    if (this._data[index].entity === null) {
      this._data[index].entity = await this.entity._manager.storage.single(this._data[index].type, this._data[index].value);
    }
    return this._data[index].entity;
  }

}
