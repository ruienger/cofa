import prompts from "prompts";
import Process from "src/core/process";
import { nullOfTheseChoice } from "./common";
import { generateStandardOutput } from "src/utils";

export const name = "promptWebcms";

export default new Process<typeof name>(name, {
  async runner() {
    let componentlib: any = "";

    const prefix = this.input.promptTarget as "webcms";
    const answer = await prompts([
      {
        type: "select",
        name: "framework",
        message: "选择您想要使用的web端框架",
        choices: [{ title: "React", value: "react" }, { title: "Vue3", value: "vue3" }, { title: "Vue2", value: "vue2" }, { title: "Angular", value: "angular" }, nullOfTheseChoice],
      },
      {
        type: "select",
        name: "graphiclib",
        message: "选择您想要使用的可视化库",
        choices: [{ title: "ECharts", value: "echarts" }, { title: "D3JS", value: "d3" }, { title: "AntV", value: "antv" }, { title: "Cesium", value: "cesium" }, nullOfTheseChoice],
      },
      {
        type: "toggle",
        name: "typescript",
        message: "是否使用typescript?",
        initial: true,
        active: "yes",
        inactive: "no",
        format: (use) => (use ? "ts" : ""),
      },
    ]);

    if (answer.framework) {
      const choices: Map<string, prompts.Choice[]> = new Map([
        [
          "vue3",
          [
            { title: "Element-Plus", value: "eleplus" },
            { title: "ViewUI", value: "view" },
          ],
        ],
        [
          "vue2",
          [
            { title: "Element-UI", value: "eleui" },
            { title: "IView", value: "iview" },
          ],
        ],
      ]);

      componentlib = await prompts([
        {
          type: "select",
          name: "componentlib",
          message: "选择您想要使用的组件库",
          choices: (choices.get(answer.framework) || []).concat(nullOfTheseChoice),
        },
      ]).then((ans) => ans.componentlib);
    }

    const { typescript, graphiclib, framework } = answer;

    return generateStandardOutput([prefix, framework, graphiclib, typescript, componentlib]);
  },
  needs: {
    promptTarget: (output) => {
      return output === "webcms";
    },
  },
});
