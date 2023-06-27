import select from "@inquirer/select";
import confirm from "@inquirer/confirm";
import Process from "src/core/process";
import { generateStandardOutput } from "src/utils";
import { nullOfTheseChoice } from "./common";

export const name = "promptNodelib";

export default new Process<typeof name>(name, {
  async runner() {
    const buildlib = await select({
      message: "选择您想要使用的打包库",
      choices: [
        { name: "RollUp", value: "rollup" },
        { name: "Vite", value: "vite" },
        nullOfTheseChoice,
      ],
    });
    const typescript: any = await confirm({
      message: "是否使用typescript",
      transformer(value) {
        return value ? "ts" : "";
      },
    });

    return generateStandardOutput([
      this.input.promptTarget,
      buildlib,
      typescript,
    ]);
  },
  needs: {
    promptTarget: (output) => {
      return output === "nodelib";
    },
  },
});
