import inquirer from "inquirer";
import Process from "src/core/process";

export const name = "projectTypePrompt";

export default new Process<typeof name, "create">(name, {
  async runner({ projectname }) {
    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "type",
        message: `${projectname}的类型是?`,
        choices: ["web", "modileapp", "cmdline", "lib"],
      },
    ]);

    return answer.type;
  },
});
