import ModelField from 'nlc-sql/src/types/ModelField';



export default class NumberField extends ModelField {

  /**
   * @param {import('Knex').CreateTableBuilder} table
   * @param {ModelField} field
   */
  static createSingle(table, field) {
    table.integer(field.name);
  }

  /**
   * @param {import('Knex').CreateTableBuilder} table
   * @param {ModelField} field
   */
  static createMulti(table, field) {
    this.addMultiFields(table);
    table.integer('value');
  }

}
