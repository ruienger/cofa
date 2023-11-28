import type { StandardProcessOutput } from "types/process";
import { resolve } from "node:path";
import Process from "src/core/process";
import { exec, gitinit } from "src/utils";
import logger from "src/logger";

export const name = "actionInit";

export default new Process<typeof name>(name, {
  async runner({ projectname, folderpath }) {
    const output = this.input.actionClone as StandardProcessOutput;
    const targetpath = resolve(folderpath, projectname);
    await gitinit(targetpath, output.type);

    await exec(`npm pkg set name=${projectname}`);
    logger.success("project has been succuessfully init");
    logger.success("run these commands to continue");
    logger.command(`cd ${targetpath}`);
    logger.command("npm i");
    logger.command("npm run dev");
    logger.ok("HAPPY DEVELOPE");

    return output;
  },
  needs: {
    actionClone: () => true,
  },
});
