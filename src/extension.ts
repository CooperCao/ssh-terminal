import * as vscode from "vscode";
import * as path from "path";
import * as fse from "fs-extra";

const VENDOR_FOLDER = ".vscode";

const CONFIG_FILENAME = "ssh.json";
const CONFIG_PATH = path.join(VENDOR_FOLDER, CONFIG_FILENAME);

function getConfigPath(basePath: string) {
  return path.join(basePath, CONFIG_PATH);
}

function readConfig(): any {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return undefined;
  }
  const configPath = getConfigPath(workspaceFolders[0].uri.fsPath);
  if (fse.pathExistsSync(configPath)) {
    return fse.readJSONSync(configPath);
  }
  return undefined;
}

function getSshCommand(
  config: { host: string; port: number; username: string },
  extraOption?: string
) {
  let sshStr = `ssh -t ${config.username}@${config.host} -p ${config.port}`;
  if (extraOption) {
    sshStr += ` ${extraOption}`;
  }
  return sshStr;
}

function isValidFile(uri: vscode.Uri) {
  return uri.scheme === "file";
}

function isConfigFile(uri: vscode.Uri) {
  const filename = path.basename(uri.fsPath);
  return filename === CONFIG_FILENAME;
}

function isInWorkspace(filepath: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  return (
    workspaceFolders &&
    workspaceFolders.some(
      // vscode can't keep filepath's stable, covert them to toLowerCase before check
      (folder) =>
        filepath.toLowerCase().indexOf(folder.uri.fsPath.toLowerCase()) === 0
    )
  );
}

let watcher: vscode.FileSystemWatcher;
export async function activate(context: vscode.ExtensionContext) {
  console.log("activate");
  let remoteConfig = readConfig();

  const folder = vscode.workspace.workspaceFolders?.[0];
  if (folder) {
    watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(folder, CONFIG_PATH),
      false,
      false,
      false
    );
    watcher.onDidChange(function (event) {
      remoteConfig = readConfig();
    });
    watcher.onDidCreate(function (event) {
      remoteConfig = readConfig();
    });
    watcher.onDidDelete(function (event) {
      remoteConfig = undefined;
    });
  }

  // args from tasks.json inputs args
  let open = vscode.commands.registerCommand("ssh-terminal.open", (args) => {
    if (remoteConfig == undefined) {
      vscode.window.showErrorMessage("Please create ssh.json in .vscode ");
      return;
    }
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
    if (remoteConfig == undefined) {
      vscode.window.showErrorMessage("Please create ssh.json in .vscode ");
      return;
    }

    let cmd = args;
    if (args == undefined) {
      cmd = remoteConfig.command;
    }
    if (cmd == undefined) {
      vscode.window.showErrorMessage("No found command");
      return;
    }

    var bash = vscode.window.terminals.find(
      (bash) => bash.name == remoteConfig.name
    );

    if (bash == undefined) {
      vscode.window.showErrorMessage("Please run Open SSH-Terminal first");
      return;
    }
    bash.sendText(cmd);
  });

  let close = vscode.commands.registerCommand("ssh-terminal.close", () => {
    if (remoteConfig == undefined) {
      vscode.window.showErrorMessage("Please create ssh.json in .vscode ");
      return;
    }
    var bash = vscode.window.terminals.find(
      (bash) => bash.name == remoteConfig.name
    );
    bash?.dispose();
  });

  context.subscriptions.push(run);
  context.subscriptions.push(close);
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.log("deactivate");
  watcher?.dispose();
}
