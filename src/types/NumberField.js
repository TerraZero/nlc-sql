const SQL = require('../../index');
const Knex = require('knex');

module.exports = class NumberField extends SQL.types.ModelField {

  /**
   * @param {Knex.CreateTableBuilder} table
   * @param {SQL.types.ModelField} field
   */
  static createSingle(table, field) {
    table.integer(field.name);
  }

  /**
   * @param {Knex.CreateTableBuilder} table
   * @param {SQL.types.ModelField} field
   */
  static createMulti(table, field) {
    this.addMultiFields(table);
    table.integer('value');
  }

}
