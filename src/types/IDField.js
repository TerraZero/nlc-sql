import ModelField from 'nlc-sql/src/types/ModelField';



export default class IDField extends ModelField {

  /**
   * @param {import('Knex').CreateTableBuilder} table
   * @param {ModelField} field
   */
  static createSingle(table, field) {
    table.increments(field.name);
  }

}
