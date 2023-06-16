import { Command } from "commander";

export default function (cmdr: Command) {
  return cmdr
    .command("config")
    .description("配置")
    .action(() => {
      console.warn("未实现");
    });
}
