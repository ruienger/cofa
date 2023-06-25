import prompts from "prompts";
import Process from "src/core/process";
import { generateStandardOutput } from "src/utils";
import { nullOfTheseChoice } from "./common";

export const name = "promptWebcms";

export default new Process<typeof name>(name, {
  async runner() {
    const { framework, graphiclib, typescript } = await prompts([
      {
        type: "select",
        name: "framework",
        message: "选择您想要使用的web端框架",
        choices: [{ title: "React", value: "react" }, { title: "Vue3", value: "vue3" }, { title: "Vue2", value: "vue2" }, nullOfTheseChoice],
      },
      {
        type: "select",
        name: "graphiclib",
        message: "选择您想要使用的可视化库",
        choices: [{ title: "ECharts", value: "echarts" }, { title: "D3JS", value: "d3" }, { title: "Cesium", value: "cesium" }, nullOfTheseChoice],
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

    if (framework) {
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

      const { componentlib } = await prompts([
        {
          type: "select",
          name: "componentlib",
          message: "选择您想要使用的组件库",
          choices: (choices.get(framework) || []).concat(nullOfTheseChoice),
        },
      ]);
      return generateStandardOutput([this.input.promptTarget, framework, graphiclib, typescript, componentlib]);
    }

    return generateStandardOutput([this.input.promptTarget, framework, graphiclib, typescript]);
  },
  needs: {
    promptTarget: (output) => {
      return output === "webcms";
    },
  },
});
