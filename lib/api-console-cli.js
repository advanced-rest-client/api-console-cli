import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { BuildCommand } from './commands/BuildCommand.js';
import { GenerateJsonCommand } from './commands/GenerateJsonCommand.js';
import { ServeCommand } from './commands/ServeCommand.js';
import chalk from 'chalk';

export class ApiConsoleCli {
  constructor(argv=[]) {
    const mainDefinitions = [
      { name: 'command', defaultOption: true },
      { name: '--help' },
    ];
    const mainOptions = commandLineArgs(mainDefinitions, {
      stopAtFirstUnknown: true,
      argv
    });
    this.command = mainOptions.command;
    this.argv = mainOptions._unknown || [];

    this.commands = new Map();
    this.addCommand(new BuildCommand());
    this.addCommand(new GenerateJsonCommand());
    this.addCommand(new ServeCommand());
  }

  addCommand(cmd) {
    this.commands.set(cmd.name, cmd);
    cmd.aliases.forEach((alias) => {
      this.commands.set(alias, cmd);
    });
  }

  async run() {
    const command = this.commands.get(this.command);
    const { argv } = this;
    if (!command) {
      if (argv.indexOf('--help') !== -1) {
        await this.help();
        return;
      }
      throw new Error(`Unknown command: ${this.command}`);
    }
    if (argv.indexOf('--help') !== -1) {
      await command.help();
      return;
    }
    try {
      const commandOptions = commandLineArgs(command.args, { argv, camelCase: true });
      return await command.run(commandOptions);
    } catch (e) {
      if (e.name === 'UNKNOWN_OPTION') {
        /* eslint-disable-next-line no-console */
        console.error(chalk`\n{red ${e.message}}`);
        await command.help();
        return;
      }
      throw e;
    }
  }

  async help() {
    const sections = [
      {
        header: 'api-console',
        content: 'Bundles API Console, generates API data model, and preview bundle in local environment.'
      },
      {
        header: 'SYNOPSIS',
        content: [
          '$ api-console build {bold -t} {underline type} [options] {underline file}',
          '$ api-console generate-json {bold -t} {underline type} [options] {underline file}',
          '$ api-console serve [options] [{underline location}]',
        ]
      },
      {
        header: 'USAGE',
        content: [
          'Run command with {bold --help} option to see help topic.',
          '',
          '$ api-console build --help',
        ]
      },
    ];
    const usage = commandLineUsage(sections)
    /* eslint-disable-next-line no-console */
    console.log(usage);
  }
}
