import type { StandardProcessOutput } from "types/process";
import { resolve } from "node:path";
import Process from "src/core/process";
import { clone, mkdir, move } from "src/utils";

export const name = "actionClone";

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
    const contentpath = resolve(targetpath, `${output.repo}-${output.branch}`);
    // 下载git压缩包然后为用户配置基本内容
    await mkdir(targetpath);
    await clone(output, targetpath);
    await move(contentpath, targetpath);

    return output;
  },
  needs: {
    promptWebcms: () => true,
    promptNodelib: () => true,
    promptTempurl: () => true,
  },
  needsValidStrategy: "some",
});
