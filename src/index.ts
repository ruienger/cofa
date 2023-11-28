import mri from "mri";
import Scheduler from "src/core/scheduler";
import promptTarget from "./process/target";
import promptWebcms from "./process/webcms";
import promptNodelib from "./process/nodelib";
import promptTempurl from "./process/tempurl";
import actionClone from "./process/clone";
import actionInit from "./process/init";
import logger from "./logger";
import { exec } from "./utils";

async function main(argv: string[]) {
  const {
    _: [projectname = "cofa-project", folderpath = ""],
    template,
    help,
    version,
  } = mri(argv, {
    alias: {
      t: "template",
      h: "help",
      v: "version",
    },
    unknown(flag) {
      logger.question("unknown option " + flag);
      process.exit(0);
    },
  });

  if (help) {
    // 帮助页
    logger.command("cofa [-t | --template] <projectname> [<folderpath>]");
    logger.command("cofa usages:");
    logger.command("    cofa");
    logger.command("    cofa your_project_name");
    logger.command("    cofa your_project_name /path/to/target/");
    logger.command("    cofa --template https://github.com/user/repo#branch");
    logger.command("cofa options:");
    logger.command("    --help         log this help infomation");
    logger.command("    -h             alias of --help");
    logger.command("    --version      log cofa version");
    logger.command("    -v             alias of --version");
    logger.command(
      "    --template     directly use the template-repo url as default"
    );
    logger.command("    -t             alias of --template");
    process.exit(0);
  }
  if (version) {
    // 获取 package.json 中的 version 字段并展示
    const { stdout, stderr } = await exec("npm pkg get version");

    if (stderr) {
      logger.failed("unable to get cofa's version");
    } else {
      logger.log(stdout.replace(/"/g, ""));
    }
    process.exit(0);
  }

  const scheduler = new Scheduler([
    promptTarget,
    promptWebcms,
    promptNodelib,
    promptTempurl,
    actionClone,
    actionInit,
  ]);

  scheduler.run({
    projectname,
    folderpath,
    givenurl: template,
  });
}

const argv = process.argv.slice(2);
main(argv);
