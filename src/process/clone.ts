import type { StandardProcessOutput } from "types/process";
import { resolve } from "node:path";
import Process from "src/core/process";
import { clone, mkdir, move } from "src/utils";
import logger from "src/logger";

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
    if (!output) {
      logger.error("internal: output is not a standard type");
      throw new Error("output error");
    }

    const targetpath = resolve(folderpath, projectname);
    // 下载git压缩包然后为用户配置基本内容
    await mkdir(targetpath);
    await clone(output, targetpath);

    return output;
  },
  needs: {
    promptWebcms: () => true,
    promptNodelib: () => true,
    promptTempurl: () => true,
  },
  needsValidStrategy: "some",
});
