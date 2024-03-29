export interface StandardProcessOutput {
  type: "github" | "gitlab";
  host: string;
  username: string;
  repo: string;
  branch: string;
  path: string;
  url: string;
}

// 所有流程的名称以及其输出内容在这里定义
export type ProcessOutputMap = {
  standard: any;
  promptTarget: "webcms" | "nodelib" | "tempurl";
  promptWebcms: StandardProcessOutput;
  promptNodelib: StandardProcessOutput;
  promptTempurl: StandardProcessOutput;
  actionClone: StandardProcessOutput;
  actionInit: StandardProcessOutput;
};

export type ProcessName = keyof ProcessOutputMap;

export type ProcessStatus = "Idle" | "Running" | "Abort" | "Finished" | "Error";

export type ProcessOutput<T extends ProcessName> = ProcessOutputMap[T];

export type ProcessNeeds = {
  [T in ProcessName]?: (output: ProcessOutputMap[T]) => boolean;
};

export type ProcessInput = {
  [T in keyof ProcessNeeds]?: ProcessOutputMap[T];
};
