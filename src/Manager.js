const NLC = require('nlc');
const SQL = require('../index');

module.exports = class Manager {

  static get service() {
    return {
      name: 'sql.manager',
    };
  }

  static create() {
    return new this();
  }

  constructor() {
    this._definitions = null;
    this._connections = {};
    this._active = 'default';
  }

  /**
   * @returns {Object<string, SQL.SQLDefinition>}
   */
  get definitions() {
    if (this._definitions === null) {
      this._definitions = {};

      const manager = NLC.get();
      const sql = manager.config.all('sql');
      const path = manager.config.all('path');

      for (const index in sql) {
        if (!sql[index]) continue;

        for (const name in sql[index]) {
          if (this._definitions[name] === undefined) {
            this._definitions[name] = {
              models: [],
              definition: null,
            };
          }

          this._definitions[name].models.push({ path: path[index], models: sql[index][name].models });
          this._definitions[name].definition = sql[index][name].definition;
          this._definitions[name].storage = sql[index][name].storage || this._definitions[name].storage || 'sql.storage.default';
        }
      }
      manager.trigger('sql:definitions', this, this._definitions);
    }
    return this._definitions;
  }

  /**
   * @returns {SQL.Knex}
   */
  get query() {
    return this.getConnection().query;
  }

  /**
   * @returns {SQL.Storage}
   */
  get storage() {
    return this.getConnection().storage;
  }

  /**
   * @returns {Object<string, typeof SQL.Model>}
   */
  get models() {
    return this.getConnection().models;
  }

  /**
   * @param {string} newConnection
   * @returns {string}
   */
  setConnection(newConnection) {
    const oldConnection = this._active;

    this._active = newConnection;
    return oldConnection;
  }

  /**
   * @param {string} connection
   * @returns {SQL.Connection}
   */
  getConnection(connection = null) {
    if (connection === null) connection = this._active;
    if (this._connections[connection] === undefined) {
      this._connections[connection] = new SQL.Connection(connection, this.definitions[connection]);
    }
    return this._connections[connection];
  }

  /**
   * @param {string} name
   * @returns {typeof SQL.Model}
   */
  getModel(name) {
    return this.models[name] || null;
  }

  /**
   * @param {typeof SQL.Model} model
   * @returns {this}
   */
  addModel(model) {
    this.getConnection().addModel(model);
    return this;
  }

}
