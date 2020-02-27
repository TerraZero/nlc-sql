import 'nlc-sql/types';

export default class Storage {

  /**
   * @param {import('nlc-sql/src/SQLManager').default} manager
   */
  constructor(manager) {
    this._manager = manager;
    this._logger = manager.logger.create('storage');
    this._cache = {};
    this._unsaved = [];
  }

  /**
   * @returns {Object<string, Object<number, import('nlc-sql/src/Model').default>>}
   */
  get cache() {
    return this._cache;
  }

  /**
   * @param {typeof import('nlc-sql/src/Model').default} model
   * @param {FieldDefinition} field
   * @returns {string}
   */
  getTable(model, field = null) {
    if (field === null) {
      return model.name.toLowerCase();
    } else {
      return (model.name + '__' + field.name).toLowerCase();
    }
  }

  /**
   * @param {string} model
   * @param {Object<string, any>} data
   * @param {boolean} tmp
   * @returns {import('nlc-sql/src/Model').default}
   */
  create(model, data, tmp = false) {
    this._logger.trace('Create new entity ' + model + (tmp ? ' temporary' : ''));
    const entity = this._manager.getModel(model).create(data);

    if (!tmp) {
      this._unsaved.push(entity);
    }
    return entity;
  }

  /**
   * @param {string|T_EntityKey} model
   * @param {(number|number[])} ids
   * @returns {Promise<import('nlc-sql/src/Model').default>}
   */
  async single(model, id) {
    if (typeof model === 'object') {
      id = model.id;
      model = model.type;
    }

    const entities = await this.load(model, id);

    return entities[id];
  }

  /**
   * @param {string} model
   * @param {(number|number[])} ids
   * @returns {Promise<Object<number, import('nlc-sql/src/Model').default>>}
   */
  async load(model, ids = null) {
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    this._logger.trace('Load entity ' + model + ' (' + ids.join(', ') + ')');
    const model_class = this._manager.getModel(model);
    this.cache[model] = this.cache[model] || {};

    const entities = {};
    const unloaded = [];

    for (const id of ids) {
      if (this.cache[model][id] === undefined) {
        unloaded.push(id);
      } else {
        entities[id] = this.cache[model][id];
      }
    }

    for (const row of await this._manager.query(this.getTable(model_class)).select('*').whereIn('id', unloaded)) {
      for (const [name, field] of model_class.fields) {
        if (!field.options.multi) continue;
        const field_row = await this._manager.query(this.getTable(model_class, field)).select('*').where('reference', row.id).orderBy('delta');

        if (field_row.length) {
          row[name] = field_row;
        }
      }

      const entity = model_class.create(row);

      this.cache[model][entity.id] = entity;
      entities[entity.id] = entity;
    }

    return entities;
  }

  /**
   * @param {(import('nlc-sql/src/Model').default|import('nlc-sql/src/Model').default[])} entity
   * @returns {Promise}
   */
  async save(entity) {
    return this.doUnsaved(true).then(() => {
      if (!Array.isArray(entity)) {
        entity = [entity];
      }
      const promises = [];

      for (const item of entity) {
        promises.push(this.doSave(item));
      }
      return Promise.all(promises);
    });
  }

  /**
   * @param {boolean} changed
   * @returns {Promise}
   */
  doUnsaved(changed = false) {
    let promise = null;

    if (this._unsaved.length === 0) {
      promise = Promise.resolve();
    } else {
      let entity = null;

      while (entity = this._unsaved.shift()) {
        if (promise === null) {
          promise = this.doSave(entity);
        } else {
          promise = promise.then(() => this.doSave(entity));
        }
      }
    }

    if (changed) {
      const promises = [];

      for (const model in this.cache) {
        for (const id in this.cache[model]) {
          if (this.cache[model][id]._changed) {
            promises.push(this.doSave(this.cache[model][id]));
          }
        }
      }
      if (promises.length) {
        return promise.then(() => Promise.all(promises));
      }
    }

    return promise;
  }

  /**
   * @param {import('nlc-sql/src/Model').default} entity
   * @returns {Promise}
   */
  doSave(entity) {
    if (!entity._changed && !entity.isNew) return Promise.resolve();

    this._logger.trace('Save entity ' + entity.toString());

    let promise = null;
    if (entity.isNew) {
      promise = this._manager.query(this.getTable(entity.struct)).insert(entity.sql).then((id) => {
        entity.set('id', id[0]);
        return id;
      });
    } else {
      promise = this._manager.query(this.getTable(entity.struct)).where('id', entity.id).update(entity.sql);
    }
    return promise.then(() => {
      const promises = [];

      for (const [, field] of entity.fields) {
        if (!field.definition.options.multi) continue;

        const row = this._manager.query(this.getTable(entity.struct, field.definition)).where('reference', entity.id).delete();

        const data = field.struct.sql(entity, field);
        if (data === null) continue;

        promises.push(
          row.then(() => {
            return this._manager.query(this.getTable(entity.struct, field.definition)).insert(data);
          })
        );
      }
      return Promise.all(promises);
    }).then(() => {
      entity._changed = false;
    });
  }

  /**
   * @param {(import('nlc-sql/src/Model').default|import('nlc-sql/src/Model').default[])} entity
   * @returns {Promise}
   */
  delete(entity) {
    if (!Array.isArray(entity)) {
      entity = [entity];
    }
    const promises = [];

    for (const item of entity) {
      promises.push(this.doDelete(item));
    }
    return Promise.all(promises);
  }

  /**
   * @param {import('nlc-sql/src/Model').default} entity
   * @returns {Promise}
   */
  doDelete(entity) {
    this._logger.trace('Delete entity ' + entity.toString());
    const promises = [];

    for (const [, field] of entity.fields) {
      if (!field.definition.options.multi) continue;
      promises.push(this._manager.query(this.getTable(entity.struct, field.definition)).where('reference', entity.id).delete());
    }
    promises.push(this._manager.query(this.getTable(entity.struct)).where('id', entity.id).delete());
    return Promise.all(promises).then(() => {
      if (this.cache[entity.struct.name] !== undefined) {
        delete this.cache[entity.struct.name][entity.id];
      }
    });
  }

  /**
   * @param {string} model
   * @param {(number|number[])} id
   * @returns {Promise}
   */
  fastDelete(model, id) {
    model = this._manager.getModel(model);
    if (!Array.isArray(id)) {
      id = [id];
    }
    const promises = [];

    for (const item of id) {
      promises.push(this.doFastDelete(model, item));
    }
    return Promise.all(promises);
  }

  /**
   * @param {typeof import('nlc-sql/src/Model').default} model
   * @param {number} id
   * @returns {Promise}
   */
  doFastDelete(model, id) {
    this._logger.trace('Fast delete entity ' + entity.toString());

    const promises = [];

    for (const [, field] of model.fields) {
      if (!field.options.multi) continue;
      promises.push(this._manager.query(this.getTable(model, field)).where('reference', id).delete());
    }
    promises.push(this._manager.query(this.getTable(model)).where('id', id).delete());
    return Promise.all(promises).then(() => {
      if (this.cache[model.name] !== undefined) {
        delete this.cache[model.name][id];
      }
    });
  }

}
