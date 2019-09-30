const NLC = require('nlc');
const SQL = require('../index');

const Glob = require('glob');

module.exports = class Connection {

  /**
   * @param {string} name
   * @param {SQL.SQLDefinition} definition
   */
  constructor(name, definition) {
    this._name = name;
    this._definition = definition;
    this._storage = NLC.get().service(definition.storage);

    this._models = {};
    this._knex = null;
  }

  /**
   * @returns {SQL.Knex}
   */
  get query() {
    if (this._knex !== null) return this._knex;

    for (const { path, models } of this._definition.models) {
      const files = Glob.sync(models, {
        cwd: path,
        absolute: true,
      });

      for (const file of files) {
        this.addModel(require(file));
      }
    }

    this._knex = SQL.Knex(this._definition.definition);
    return this._knex;
  }

  /**
   * @returns {SQL.Storage}
   */
  get storage() {
    return this._storage;
  }

  /**
   * @returns {Object<string, typeof SQL.Model>}
   */
  get models() {
    this.query;
    return this._models;
  }

  /**
   * @param {typeof SQL.Model} model
   * @returns {this}
   */
  addModel(model) {
    this._models[model.name] = model;
    return this;
  }

  /**
   * @param {string} name
   * @returns {typeof SQL.Model}
   */
  getModel(name) {
    return this._models[name] || null;
  }

  /**
   * @returns {Promise}
   */
  create() {
    const promises = [];

    for (const name in this.models) {
      promises.push(this.query.schema.hasTable(this.storage.getTable(this.models[name])).then((exists) => {
        if (!exists) return this.createTable(this.models[name]);
      }));
    }
    return Promise.all(promises);
  }

  /**
   * @returns {Promise}
   */
  drop() {
    const promises = [];

    for (const name in this.models) {
      promises.push(this.query.schema.dropTableIfExists(this.storage.getTable(this.models[name])));
      for (const [field, definition] of this.models[name].fields) {
        promises.push(this.query.schema.dropTableIfExists(this.storage.getTable(this.models[name], definition)));
      }
    }
    return Promise.all(promises);
  }

  /**
   * @param {typeof SQL.Model} model
   * @returns {Promise}
   */
  createTable(model) {
    const promises = [];

    promises.push(this.query.schema.createTable(this.storage.getTable(model), function (table) {
      for (const [field, definition] of model.fields) {
        if (definition.options.multi) continue;
        definition.field.createSingle(table, definition);
      }
    }));

    for (const [field, definition] of model.fields) {
      if (!definition.options.multi) continue;
      promises.push(this.query.schema.createTable(this.storage.getTable(model, definition), function (table) {
        definition.field.createMulti(table, definition);
      }));
    }

    return Promise.all(promises);
  }

}
