const SQL = require('../../index');
const Knex = require('knex');

module.exports = class IDField extends SQL.types.ModelField {

  /**
   * @param {Knex.CreateTableBuilder} table
   * @param {SQL.types.ModelField} field
   */
  static createSingle(table, field) {
    table.increments(field.name);
  }

}
