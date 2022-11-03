import inquirer from "inquirer";
import Process from "src/core/process";
import { name as depName } from "./init_prompt";

const gitRepoUrl: Record<string, string> = {
  'plain-project': 'https://github.com/ruienger/r2puc.git',
  'vue-project': 'https://github.com/ruienger/r2puc.git',
  'node-project': 'https://github.com/ruienger/r2puc.git',
}

export const name = 'clone_repo_prompt'

export default new Process<string>(name, {
  runner(projectname: string) {
    return inquirer.prompt([{
      type: 'list',
      name: 'type',
      message: `please select the usage of project <${projectname}>`,
      choices: Object.keys(gitRepoUrl),
    }]).then(answers => {
      return gitRepoUrl[answers.type]
    })
  },
  needs: [{ name: depName, output: 0 }],
})