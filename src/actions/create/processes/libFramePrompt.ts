import inquirer from "inquirer";
import Process from "src/core/process";
import { name as depName } from "./projectTypePrompt";

export const name = "libFramePrompt";

export default new Process<typeof name, "create">(name, {
  async runner() {
    const rollup = await inquirer.prompt([
      {
        type: "list",
        name: "type",
        message: `对于该库,你希望使用的打包库是?`,
        choices: ["rollup", "不使用"],
      },
    ]);
    if (rollup !== "rollup") return "";
    const ts = await inquirer.prompt([
      {
        type: "confirm",
        name: "ts",
        message: `对于库文件,你希望使用typescript开发么?`,
      },
    ]);
    if (ts) return "lib_ts_rollup";
    return "lib_rollup";
  },
  needs: {
    [depName]: (output) => {
      return output === "lib";
    },
  },
});
