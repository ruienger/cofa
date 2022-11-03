import inquirer from "inquirer";
import Process from "src/core/process";
import { name as depName } from "./init_prompt";

export const name = 'npm_init_prompt'

export default new Process<{ byDefault: boolean }>(name, {
  runner(projectname: string) {
    return inquirer.prompt([{
      type: 'confirm',
      name: 'byDefault',
      message: `init <${projectname}> by default?`,
    }])
  },
  needs: [{ name: depName }],
})