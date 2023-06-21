import Process from "src/core/process";
import prompts from "prompts";

export const name = "promptTempurl";

export default new Process<typeof name>(name, {
  async runner({ givenurl }) {
    // (https://github.com)/(user)/(repo)(#(branch))?
    const reg = /^(https:\/\/github\.com)\/([\w-]+)\/([\w-]+)(\#([\w-]+))?$/;
    if (!givenurl) {
      const { url } = await prompts([
        {
          type: "text",
          name: "url",
          message: "输入代码模板url，例如：https://github.com/user/repo#branch?",
          validate: (prev) => {
            return reg.test(prev);
          },
        },
      ]);
      givenurl = url;
    }
    const match = reg.exec(givenurl as string);

    if (!match) throw new Error("given url do not match the standard rule");
    return {
      location: match[1],
      username: match[2],
      repo: match[3],
      branch: match[5] || "master",
    };
  },
  needs: {
    promptTarget: (output) => {
      return output === "tempurl";
    },
  },
});
