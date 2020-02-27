import 'nlc-sql/types';
import Knex from 'knex';



export default class Connection {

  /**
   * @param {import('nlc/src/Core').default} core
   * @param {import('nlc-sql/src/SQLManager').default} manager
   * @param {string} name
   * @param {T_SQLDefinition} definition
   */
  constructor(core, manager, name, definition) {
    this._manager = manager;
    this._name = name;
    this._definition = definition;
    this._storage = core.service(definition.storage);
    this._logger = manager.logger.create(name);

    this._knex = null;

    if (this._definition.models === '*') {
      this._definition.models = manager.getAllModels();
    }
  }

  /**
   * @returns {Knex}
   */
  get query() {
    if (this._knex !== null) return this._knex;
    this._knex = Knex(this._definition.target);
    this._knex.on('query', this.onKnexQuery.bind(this));
    return this._knex;
  }

  /**
   * @returns {import('nlc-sql/src/Storage').default}
   */
  get storage() {
    return this._storage;
  }

  onKnexQuery(query) {
    let sql = query.sql;
    for (const binding of query.bindings) {
      sql = sql.replace('?', binding);
    }
    this._logger.trace(sql);
  }

  /**
   * @returns {Promise}
   */
  create() {
    const promises = [];

    for (const name of this._definition.models) {
      promises.push(this.query.schema.hasTable(this.storage.getTable(this._manager.getModel(name))).then((exists) => {
        if (!exists) return this.createTable(this._manager.getModel(name));
      }));
    }
    return Promise.all(promises);
  }

  /**
   * @returns {Promise}
   */
  drop() {
    const promises = [];

    for (const name of this._definition.models) {
      promises.push(this.query.schema.dropTableIfExists(this.storage.getTable(this._manager.getModel(name))));
      for (const [, definition] of this._manager.getModel(name).fields) {
        promises.push(this.query.schema.dropTableIfExists(this.storage.getTable(this._manager.getModel(name), definition)));
      }
    }
    return Promise.all(promises);
  }

  /**
   * @param {typeof import('nlc-sql/src/Model').default} model
   * @returns {Promise}
   */
  createTable(model) {
    const promises = [];

    promises.push(this.query.schema.createTable(this.storage.getTable(model), function (table) {
      for (const [, definition] of model.fields) {
        if (definition.options.multi) continue;
        definition.field.createSingle(table, definition);
      }
    }));

    for (const [, definition] of model.fields) {
      if (!definition.options.multi) continue;
      promises.push(this.query.schema.createTable(this.storage.getTable(model, definition), function (table) {
        definition.field.createMulti(table, definition);
      }));
    }

    return Promise.all(promises);
  }

}
