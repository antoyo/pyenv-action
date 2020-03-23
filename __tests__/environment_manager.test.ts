import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import * as engine from '../src/engine';
import * as defaults from '../src/defaults';

const tmpPath = path.join(__dirname, '.environment-tmp');

describe('EnvironmentManager', () => {
  beforeAll(async () => {
    const toolDir = path.join(
      tmpPath,
      'runner',
      path.join(
        Math.random()
          .toString(36)
          .substring(7)
      ),
      'tools'
    );
    const tempDir = path.join(
      tmpPath,
      'runner',
      path.join(
        Math.random()
          .toString(36)
          .substring(7)
      ),
      'temp'
    );
    await io.rmRF(toolDir);
    await io.rmRF(tempDir);
    process.env['RUNNER_TOOL_CACHE'] = toolDir;
    process.env['RUNNER_TEMP'] = tempDir;
  }, 100000);

  it('can write script to cache', async () => {
    // Given that the input "command: echo $HOME"
    process.env['INPUT_COMMAND'] = 'echo $HOME';

    // When I install pyenv
    const context = new engine.BuildContext({
      pyenv_version: defaults.PYENV_VERSION
    });
    // Download and Install pyenv
    const installer = new engine.PyEnvInstaller(context.pyenv_version);

    const archive_path = await installer.downloadArchive();
    const pyenv_root = await installer.installFromArchive(archive_path);

    const environment = new engine.EnvironmentManager({context, pyenv_root});

    // And I call ensure_script_exists_with_command()
    const script_path = await environment.ensure_script_exists_with_command(
      '3.7.3'
    );

    // Then it should return the path to the script
    expect(fs.existsSync(script_path)).toBeTruthy();
    expect(fs.statSync(script_path).isFile()).toBeTruthy();

    // And it should be a bash script
    expect(fs.readFileSync(script_path).toString()).toEqual(
      '#!/bin/bash\n# auto-generated by gabrielfalcao/pyenv-action\n\n# set python version within this script\nexport PYENV_VERSION="3.7.3";\n\nset -ex;\n# run user-provided command:\necho $HOME;'
    );
  });
});
