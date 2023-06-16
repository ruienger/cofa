import { Command } from "commander";

export default function (cmdr: Command) {
  return cmdr
    .command("build")
    .description("构建/打包")
    .action(() => {
      console.warn("未实现");
    });
}
