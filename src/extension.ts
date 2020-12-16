import * as vscode from "vscode";
import * as path from "path";
import * as fse from "fs-extra";

const VENDOR_FOLDER = ".vscode";

const CONFIG_FILENAME = "ssh.json";
const CONFIG_PATH = path.join(VENDOR_FOLDER, CONFIG_FILENAME);

function getConfigPath(basePath: string) {
  return path.join(basePath, CONFIG_PATH);
}

async function setup(): Promise<any> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }
  const configPath = getConfigPath(workspaceFolders[0].uri.fsPath);
  return await fse.readJson(configPath);
}

function getSshCommand(
  config: { host: string; port: number; username: string },
  extraOpiton?: string
) {
  let sshStr = `ssh -t ${config.username}@${config.host} -p ${config.port}`;
  if (extraOpiton) {
    sshStr += ` ${extraOpiton}`;
  }
  return sshStr;
}

export async function activate(context: vscode.ExtensionContext) {
  const remoteConfig = await setup();
  // args from tasks.json inputs args
  let open = vscode.commands.registerCommand("ssh-terminal.open", (args) => {
    var terminal = vscode.window.terminals.find(
      (bash) => bash.name == remoteConfig.name
    );

    if (terminal != undefined) {
      vscode.window.showInformationMessage(
        "Already Connect to " + remoteConfig.host
      );
      terminal.show();
      return;
    }
    vscode.window.showInformationMessage("Connect to " + remoteConfig.host);
    const sshConfig = {
      host: remoteConfig.host,
      port: remoteConfig.port,
      username: remoteConfig.username,
    };
    let sshCommand;
    sshCommand = getSshCommand(sshConfig);
    const bash = vscode.window.createTerminal(remoteConfig.name);
    bash.sendText(sshCommand);
    bash.show();
  });

  context.subscriptions.push(open);

  let run = vscode.commands.registerCommand("ssh-terminal.run", (args) => {
    let cmd = args;
    if (args == undefined) {
      cmd = remoteConfig.command;
    }
    if (cmd == undefined) {
      vscode.window.showInformationMessage("No found command");
      return;
    }

    var bash = vscode.window.terminals.find(
      (bash) => bash.name == remoteConfig.name
    );

    if (bash == undefined) {
      vscode.window.showInformationMessage(
        "Please run Open SSH-Terminal first"
      );
      return;
    }
    bash.sendText(cmd);
  });

  let close = vscode.commands.registerCommand("ssh-terminal.close", () => {
    var bash = vscode.window.terminals.find(
      (bash) => bash.name == remoteConfig.name
    );
    bash?.dispose();
  });

  context.subscriptions.push(run);
  context.subscriptions.push(close);
}

// this method is called when your extension is deactivated
export function deactivate() {}
