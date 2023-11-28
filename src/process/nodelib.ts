import select from "@inquirer/select";
import confirm from "@inquirer/confirm";
import Process from "src/core/process";
import { generateStandardOutput } from "src/utils";
import { notAvailable, nullOfTheseChoice } from "./common";

export const name = "promptNodelib";

export default new Process<typeof name>(name, {
  async runner() {
    const buildlib = await select({
      message: "which packager would you like",
      choices: [
        { name: "RollUp", value: "rollup" },
        { name: "Vite", value: "vite", disabled: notAvailable },
        nullOfTheseChoice,
      ],
    });
    const typescript = (await confirm({
      message: "typescript support?",
    }))
      ? "ts"
      : "";

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
