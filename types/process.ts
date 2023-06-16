export type ProcessOutputTypeMap = {
  projectTypePrompt: "web" | "modileapp" | "cmdline" | "lib";
  webFramePrompt: "web_vue2_webpack" | "web_vue3_ts_vite" | "web_vue3_ts_ele_vite";
  libFramePrompt: "lib_rollup" | "" | "lib_ts_rollup";
  [x: string]: any;
};

export type ProcessNeeds = {
  [T in keyof ProcessOutputTypeMap]?: (output: ProcessOutputTypeMap[T]) => boolean;
};

export type ProcessOutput<T extends keyof ProcessOutputTypeMap> = ProcessOutputTypeMap[T];

// export type ProcessInput<N extends ProcessNeeds> = {
//   [T in keyof N]: Parameters<N[T] ? N[T] : () => void>
// };

export type ProcessInput<T extends keyof ProcessOutputTypeMap> = Pick<ProcessOutputTypeMap, T>;
