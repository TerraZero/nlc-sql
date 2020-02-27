import ModelField from 'nlc-sql/src/types/ModelField';



export default class StringField extends ModelField {

  /**
   * @param {import('Knex').CreateTableBuilder} table
   * @param {ModelField} field
   */
  static createSingle(table, field) {
    table.string(field.name);
  }

  /**
   * @param {import('Knex').CreateTableBuilder} table
   * @param {ModelField} field
   */
  static createMulti(table, field) {
    this.addMultiFields(table);
    table.string('value');
  }

}
