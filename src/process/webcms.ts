import select from "@inquirer/select";
import confirm from "@inquirer/confirm";
import Process from "src/core/process";
import { generateStandardOutput } from "src/utils";
import { notAvailable, nullOfTheseChoice } from "./common";

export const name = "promptWebcms";

export default new Process<typeof name>(name, {
  async runner() {
    const framework = await select({
      message: "which framework preset would you like",
      choices: [
        {
          value: "vue3",
          name: "Vue3(vuerouter & pinia)",
        },
        {
          value: "vue2",
          name: "Vue2(vuerouter & vuex)",
          disabled: notAvailable,
        },
        {
          value: "react",
          name: "React",
          disabled: notAvailable,
        },
        nullOfTheseChoice,
      ],
    });
    const graphiclib = await select({
      message: "which graphic lib would you like",
      choices: [
        {
          value: "echarts",
          name: "Echarts",
          disabled: notAvailable,
        },
        {
          value: "d3",
          name: "D3js",
          disabled: notAvailable,
        },
        {
          value: "cesium",
          name: "Cesium",
          disabled: notAvailable,
        },
        nullOfTheseChoice,
      ],
    });
    const onlyVue3 = framework === "vue3" ? false : notAvailable;
    // const onlyVue2 = framework === "vue2" ? false : notAvailable;
    const componentlib = await select({
      message: "which ui lib would you like",
      choices: [
        {
          value: "eleplus",
          name: "Element-Plus",
          disabled: onlyVue3,
        },
        {
          value: "naiveui",
          name: "NaiveUI",
          disabled: onlyVue3,
        },
        {
          value: "view",
          name: "ViewUI",
          disabled: notAvailable,
        },
        {
          value: "eleui",
          name: "ElementUI",
          disabled: notAvailable,
        },
        {
          value: "iview",
          name: "IView",
          disabled: notAvailable,
        },
        nullOfTheseChoice,
      ],
    });
    const typescript = (await confirm({
      message: "typescript support",
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
