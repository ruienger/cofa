import inquirer from "inquirer";
import Process from "src/core/process";

export const name = 'init_prompt'

export default new Process<number>(name, {
  runner(projectname: string) {
    return inquirer.prompt([{
      type: 'list',
      name: 'initMode',
      message: `which way do you perfer to init this project?`,
      choices: [{
        value: 0,
        name: 'clone a git template-repo to init the project',
      }, {
        value: 1,
        name: 'init the project step by step after running npm init',
      }],
    }]).then((res: { initMode: number }) => res.initMode)
  }
})