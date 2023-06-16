import { Command } from "commander";
import actions from "src/actions";

export default function (cmdr: Command) {
  return cmdr
    .command("create <projectname> [floderpath]")
    .option("--default", "create project with default configerations")
    .description("在指定的文件夹下创建项目")
    .action((projectname, floderpath) => {
      actions.create.run({
        projectname,
        floderpath,
      });
    });
}
