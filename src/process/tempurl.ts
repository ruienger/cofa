import select from "@inquirer/select";
import input from "@inquirer/input";
import Process from "src/core/process";
import { generateStandardOutput } from "src/utils";
import logger from "src/logger";

export const name = "promptTempurl";

export default new Process<typeof name>(name, {
  async runner({ givenurl }) {
    // (https://address)/(user)/(repo)(#(branch))?
    const reg = /^(https?:\/\/[\w-\.]+)\/([\w-]+)\/([\w-]+)(\#([\w-]+))?$/;

    const type: any = await select({
      message: "download code from",
      choices: [
        { name: "github", value: "github" },
        { name: "gitlab", value: "gitlab" },
      ],
    });
    if (!givenurl) {
      givenurl = await input({
        message: "input the repo url. e.g. https://github.com/user/repo#branch",
        validate: (prev) => {
          return reg.test(prev);
        },
      });
    } else if (!reg.test(givenurl)) {
      logger.failed(
        "given url do not match with the standard format. e.g. https://github.com/user/repo#branch"
      );
      throw new Error("format error");
    }
    const match = reg.exec(givenurl)!;

    return generateStandardOutput({
      type,
      host: match[1],
      username: match[2],
      repo: match[3],
      branch: match[5] || "master",
    });
  },
  needs: {
    promptTarget: (output) => {
      return output === "tempurl";
    },
  },
});
