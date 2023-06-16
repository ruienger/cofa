import { Command } from "commander";

export default function (cmdr: Command) {
  return cmdr
    .command("test")
    .description("测试")
    .action(() => {
      console.warn("未实现");
    });
}
