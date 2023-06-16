import inquirer from "inquirer";
import Process from "src/core/process";
import { name as libName } from "./libFramePrompt";
import { name as webName } from "./webFramePrompt.ts";
import { gitClone } from "src/utils/common";

export const name = "cloneRepo";

export default new Process<typeof name, "create">(name, {
  async runner({ projectname, floderpath = "/" }) {
    await gitClone(
      {
        url: "https://github.com/ruienger/repo-templates.git",
        branch: this.input.webFramePrompt || this.input.libFramePrompt || "master",
      },
      projectname,
      floderpath
    );
  },
  needs: {
    [libName]: () => true,
    [webName]: () => true,
  },
  needsValidStrategy: "some",
});
