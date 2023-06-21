import prompts from "prompts";
import Process from "src/core/process";
import { nullOfTheseChoice } from "./common";
import { generateStandardOutput } from "src/utils";

export const name = "promptNodelib";

export default new Process<typeof name>(name, {
  async runner() {
    const prefix = this.input.promptTarget as "nodelib";
    const answer = await prompts([
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

    const { typescript, buildlib } = answer;

    return generateStandardOutput([prefix, buildlib, typescript]);
  },
  needs: {
    promptTarget: (output) => {
      return output === "nodelib";
    },
  },
});
