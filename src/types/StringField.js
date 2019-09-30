const SQL = require('../../index');
const Knex = require('knex');

module.exports = class StringField extends SQL.types.ModelField {

  /**
   * @param {Knex.CreateTableBuilder} table
   * @param {SQL.types.ModelField} field
   */
  static createSingle(table, field) {
    table.string(field.name);
  }

  /**
   * @param {Knex.CreateTableBuilder} table
   * @param {SQL.types.ModelField} field
   */
  static createMulti(table, field) {
    this.addMultiFields(table);
    table.string('value');
  }

}
