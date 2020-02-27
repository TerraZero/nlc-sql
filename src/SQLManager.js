import 'nlc-sql/types';
import Connection from 'nlc-sql/src/Connection';



export default class SQLManager {

  /**
   * @param {import('nlc/src/Core').default} core
   * @param {import('nlc-util/src/data/Bag').default} models
   */
  constructor(core, models) {
    this._core = core;
    this._definitions = core.config.get('nlc.databases');
    this._models = {};
    this._allmodels = [];

    this._connections = {};
    this._active = 'default';
    this._logger = core.logger.logger('sql');

    this.loadModels(models);
  }

  /**
   * @returns {T_SQLDefinition[]}
   */
  get definitions() {
    return this._definitions;
  }

  /**
   * @returns {import('knex')}
   */
  get query() {
    return this.getConnection().query;
  }

  /**
   * @returns {import('nlc-sql/src/Storage').default}
   */
  get storage() {
    return this.getConnection().storage;
  }

  /**
   * @returns {import('nlc-util/src/logger/Logger').default}
   */
  get logger() {
    return this._logger;
  }

  /**
   * @param {import('nlc-util/src/data/Bag').default} models
   */
  loadModels(models) {
    for (const name in models.data) {
      this.logger.trace('Load model ' + models.get(name).file);
      this._models[name.toLowerCase()] = models.get(name).subject;
      models.get(name).subject.model = name.toLowerCase();
      this._allmodels.push(name.toLowerCase());
    }
  }

  /**
   * @returns {string[]}
   */
  getAllModels() {
    return this._allmodels;
  }

  /**
   * @param {string} newConnection
   * @returns {string}
   */
  setConnection(newConnection) {
    this.logger.trace('Set active connection to ' + newConnection);
    const oldConnection = this._active;

    this._active = newConnection;
    return oldConnection;
  }

  /**
   * @param {string} connection
   * @returns {import('nlc-sql/src/Connection').default}
   */
  getConnection(connection = null) {
    connection = connection || this._active;
    if (this._connections[connection] === undefined) {
      this._connections[connection] = new Connection(this._core, this, connection, this.definitions[connection]);
    }
    return this._connections[connection];
  }

  /**
   * @param {string} name
   * @returns {typeof import('nlc-sql/src/Model').default}
   */
  getModel(name) {
    return this._models[name] || null;
  }

}
