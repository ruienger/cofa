import select from "@inquirer/select";
import Process from "src/core/process";

export const name = "promptTarget";

export default new Process<typeof name>(name, {
  async runner({ givenurl }) {
    if (givenurl) {
      return "tempurl";
    }
    const target: any = await select({
      message: "选择代码模板类别",
      choices: [
        { name: "从 web端后台管理系统 类别里选择代码模板", value: "webcms" },
        { name: "从 库 类别里选择代码模板", value: "nodelib", disabled: true },
        { name: "从 指定的url 那里下载代码模板", value: "tempurl" },
      ],
    });

    return target;
  },
});
