import CommandInterface from 'nlc-cli/src/CommandInterface';

export default class SQLCommand extends CommandInterface {

  init() {
    return this.command('sql <command>')
      .option('-c, --connection [connection]', 'set the connection', 'default');
  }

  /**
   * @param {import('nlc-cli/src/CommandRequest').default} request
   * @param {(string|null)} command
   */
  async action(request, command) {
    /** @type {import('nlc-sql/src/SQLManager').default} */
    const manager = this.core.service('nlc.sql');

    for (const connection in manager.definitions) {
      if (request.options.connection !== connection && request.options.connection !== 'all') continue;

      request.logger.info('Set connection to ' + connection + ' with command ' + command);
      manager.setConnection(connection);

      switch (command) {
        case 'create':
          request.logger.info('Create database ' + connection);
          await manager.getConnection().create();
          break;
        case 'drop':
          request.logger.info('Drop database ' + connection);
          await manager.getConnection().drop();
          break;
      }
    }
    console.log('finish');
  }

}
