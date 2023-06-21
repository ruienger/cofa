import type { StandardProcessOutput } from "types/process";
import { resolve } from "node:path";
import Process from "src/core/process";
import { clone, mkdir, move, rmrf, unzip, exec, spin } from "src/utils";

export const name = "actionCreate";

export default new Process<typeof name>(name, {
  async runner({ projectname, folderpath }) {
    let output: StandardProcessOutput | undefined = undefined;
    if (this.input.promptNodelib) {
      output = this.input.promptNodelib;
    }
    if (this.input.promptWebcms) {
      output = this.input.promptWebcms;
    }
    if (this.input.promptTempurl) {
      output = this.input.promptTempurl;
    }
    if (!output) throw new Error("output is not standard type");

    const targetpath = resolve(folderpath, projectname);
    const zippath = resolve(targetpath, "deleteme.zip");
    const contentpath = resolve(targetpath, `${output.repo}-${output.branch}`);
    // 下载git压缩包然后为用户配置基本内容
    await mkdir(targetpath);
    await clone(output, zippath);
    await unzip(zippath, targetpath);
    await rmrf(zippath);
    await move(contentpath, targetpath);
    await exec(`cd ${targetpath} && git init`);
    console.log("项目创建完成，在终端输入以下命令以启动：");
    console.log("$ cd " + targetpath);
    console.log("$ npm i");
    console.log("$ npm run dev");
  },
  needs: {
    promptWebcms: () => true,
    promptNodelib: () => true,
    promptTempurl: () => true,
  },
  needsValidStrategy: "some",
});
