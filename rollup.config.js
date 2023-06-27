import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    file: "index.js",
    format: "es",
    banner: "#!/usr/bin/env node",
  },
  plugins: [typescript()],
};
