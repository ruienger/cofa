import type { StandardProcessOutput } from "types/process";
import { resolve } from "node:path";
import Process from "src/core/process";
import { exec, gitinit } from "src/utils";

export const name = "actionInit";

export default new Process<typeof name>(name, {
  async runner({ projectname, folderpath }) {
    const output = this.input.actionClone as StandardProcessOutput;
    const targetpath = resolve(folderpath, projectname);
    await gitinit(targetpath, output.type);

    console.log("项目初始化完成，在终端输入以下命令以启动：");
    console.log("$ cd " + targetpath);
    console.log("$ npm i");
    console.log("$ npm run dev");

    return output;
  },
  needs: {
    actionClone: () => true,
  },
});
