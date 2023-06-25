import prompts from "prompts";
import Process from "src/core/process";
import { generateStandardOutput } from "src/utils";
import { nullOfTheseChoice } from "./common";

export const name = "promptNodelib";

export default new Process<typeof name>(name, {
  async runner() {
    const { typescript, buildlib } = await prompts([
      {
        type: "select",
        name: "buildlib",
        message: "选择您想要使用的打包库",
        choices: [{ title: "RollUp", value: "rollup" }, { title: "Vite", value: "vite" }, nullOfTheseChoice],
      },
      {
        type: "toggle",
        name: "typescript",
        message: "是否使用typescript?",
        initial: true,
        active: "yes",
        inactive: "no",
        format: (use) => (use ? "ts" : ""),
      },
    ]);

    return generateStandardOutput([this.input.promptTarget, buildlib, typescript]);
  },
  needs: {
    promptTarget: (output) => {
      return output === "nodelib";
    },
  },
});
