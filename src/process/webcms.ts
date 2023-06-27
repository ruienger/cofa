import select from "@inquirer/select";
import confirm from "@inquirer/confirm";
import Process from "src/core/process";
import { generateStandardOutput } from "src/utils";
import { nullOfTheseChoice } from "./common";

export const name = "promptWebcms";

export default new Process<typeof name>(name, {
  async runner() {
    const framework = await select({
      message: "选择您想要使用的web端框架",
      choices: [
        {
          value: "vue3",
          name: "Vue3",
        },
        {
          value: "vue2",
          name: "Vue2",
          disabled: "not available yet",
        },
        {
          value: "react",
          name: "React",
          disabled: "not available yet",
        },
        nullOfTheseChoice,
      ],
    });
    const graphiclib = await select({
      message: "选择您想要使用的图形库",
      choices: [
        {
          value: "echarts",
          name: "Echarts",
          disabled: "not available yet",
        },
        {
          value: "d3",
          name: "D3js",
          disabled: "not available yet",
        },
        {
          value: "cesium",
          name: "Cesium",
          disabled: "not available yet",
        },
        nullOfTheseChoice,
      ],
    });
    const onlyVue3 = framework === "vue3" ? false : "not available";
    const onlyVue2 = framework === "vue2" ? false : "not available";
    const componentlib = await select({
      message: "选择您想要使用的组件库",
      choices: [
        {
          value: "eleplus",
          name: "Element-Plus",
          disabled: onlyVue3,
        },
        {
          value: "view",
          name: "ViewUI",
          disabled: onlyVue3,
        },
        {
          value: "eleui",
          name: "Element-UI",
          disabled: onlyVue2,
        },
        {
          value: "iview",
          name: "IView",
          disabled: onlyVue2,
        },
        nullOfTheseChoice,
      ],
    });
    const typescript = (await confirm({
      message: "是否使用typescript",
    }))
      ? "ts"
      : "";

    return generateStandardOutput([
      this.input.promptTarget,
      framework,
      graphiclib,
      typescript,
      componentlib,
    ]);
  },
  needs: {
    promptTarget: (output) => {
      return output === "webcms";
    },
  },
});
