# ssh terminal extension for VS Code

ssh terminal extension for VS Code
在.vscode下建立ssh.json文件，格式如下：

```json
{
     "name": "terminal name",
     "host": "host",
     "port": 22,
     "username": "user name",
     "initPath": "init path",
     "command": "ls -lh"
}
```

> 目前只支持通过证书免密登录，请查询相关证书免密登录方法
> 其中"command": 可以指定每次运行的命令，tasks.json中的args优先级更高

- 支持Open ssh-terminal
  连接并创建ssh-terminal终端

- 支持Run on ssh-terminal
  在ssh-terminal终端运行命令，可以传递参数
  如在.vscode tasks.json中

  ``` json
  {
    // See https://go.microsoft.com/fwlink/?LinkId=733558
    // for the documentation about the tasks.json format
    "version": "2.0.0",
    "tasks": [
        {
            "label": "preBuild",
            "command": "echo ${input:open}",
            "type": "shell",
            "problemMatcher": []
        },
        {
            "label": "build",
            "type": "shell",
            "command": "echo ${input:makeall}",
            "problemMatcher": []
        },
        {
            "label": "clean",
            "type": "shell",
            "command": "echo ${input:makeclean}",
            "problemMatcher": []
        }
    ],
    "inputs": [
        {
            "id": "open",
            "type": "command",
            "command": "ssh-terminal.run",
            "args": "ls -lh"
        },
        {
            "id": "makeall",
            "type": "command",
            "command": "ssh-terminal.run",
            "args": "make all"
        },
        {
            "id": "makeclean",
            "type": "command",
            "command": "ssh-terminal.run",
            "args": "make clean"
        }
    ]

}

  ```

- 支持Close ssh-terminal
  关闭ssh-terminal终端

