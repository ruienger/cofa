import { Command } from "commander";

export default function (cmdr: Command) {
  return cmdr
    .command("dev")
    .description("开发")
    .action(() => {
      console.warn("未实现");
    });
}
