import inquirer from "inquirer";
import Process from "src/core/process";
import { name as depName } from "./projectTypePrompt";

export const name = "webFramePrompt";

export default new Process<typeof name, "create">(name, {
  async runner() {
    const framework = await inquirer.prompt([
      {
        type: "list",
        name: "framework",
        message: `对于WEB应用,你期望使用的框架是?`,
        choices: ["vue2", "vue3"],
      },
    ]);
    if (framework === "vue2") return "web_vue2_webpack";
    const element = await inquirer.prompt([
      {
        type: "confirm",
        name: "element",
        message: `你希望使用element-plus作为组件库么?`,
      },
    ]);

    if (element) return "web_vue3_ts_ele_vite";
    return "web_vue3_ts_vite";
  },
  needs: {
    [depName]: (output) => {
      return output === "web";
    },
  },
});
