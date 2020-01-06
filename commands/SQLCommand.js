const Command = require('nlc/src/Command');
const SQL = require('../index');

module.exports = class SQLCommand extends Command {

  init() {
    return this.command('sql <command>')
      .option('-c, --connection [connection]', 'set the connection', 'default');
  }

  async action() {
    const manager = SQL.get();
    const [command] = this.request.args;

    for (const connection in manager.definitions) {
      if (this.request.options.connection !== connection && this.request.options.connection !== 'all') continue;

      this.logger.debug('Set connection to :connection with command :command', { ':connection': connection, ':command': command });
      manager.setConnection(connection);

      switch (command) {
        case 'create':
          this.logger.log('Create database :connection', { ':connection': connection });
          await manager.getConnection().create();
          break;
        case 'drop':
          this.logger.log('Drop database :connection', { ':connection': connection });
          await manager.getConnection().drop();
          break;
      }
    }
  }

}
