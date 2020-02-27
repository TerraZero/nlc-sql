import Model from 'nlc-sql/src/Model';
import StringField from 'nlc-sql/src/types/StringField';
import IDField from 'nlc-sql/src/types/IDField';
import ReferenceField from 'nlc-sql/src/types/ReferenceField';



export default class Node extends Model {

  static define() {
    return [
      IDField.create('id'),
      StringField.create('hallo'),
      StringField.create('text', { multi: true }),
      ReferenceField.create('ref', { multi: true, reference: 'node' }),
    ];
  }

}
