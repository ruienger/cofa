import select from "@inquirer/select";
import Process from "src/core/process";
import { notAvailable } from "./common";

export const name = "promptTarget";

export default new Process<typeof name>(name, {
  async runner({ givenurl }) {
    if (givenurl) {
      return "tempurl";
    }
    const target = await select({
      message: "what does this project targetting at",
      choices: [
        {
          name: "mobile application like",
          value: "mobileapp",
          disabled: notAvailable,
        },
        {
          name: "desktop application like",
          value: "pcapp",
          disabled: notAvailable,
        },
        { name: "web content management system like", value: "webcms" },
        { name: "web library like", value: "weblib", disabled: notAvailable },
        { name: "nodejs library like", value: "nodelib" },
        { name: "download template right from a git url", value: "tempurl" },
      ],
    });

    return target as any;
  },
});
