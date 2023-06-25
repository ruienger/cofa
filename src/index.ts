import mri from "mri";
import Scheduler from "src/core/scheduler";
import promptTarget from "./process/target";
import promptWebcms from "./process/webcms";
import promptNodelib from "./process/nodelib";
import promptTempurl from "./process/tempurl";
import actionCreate from "./process/create";

const argv = process.argv.slice(2);

if (argv.includes("--help")) {
  console.log("$ cofa [-t | --template] <projectname> [<folderpath>]");
  console.log("$ cofa usages:");
  console.log("$     cofa");
  console.log("$     cofa mycli");
  console.log("$     cofa mycli /path/to/target/");
  console.log("$     cofa --template https://github.com/user/repo#branch");
  console.log("$ cofa options:");
  console.log("$     --help         log this help infomation");
  console.log("$     --template     directly use the template-repo url as default");
  console.log("$     -t             alias of --template");
  process.exit(0);
}

const {
  _: [projectname = "cofa-creation", folderpath = ""],
  template,
} = mri(argv, {
  alias: {
    t: "template",
  },
  unknown(flag) {
    console.error("unknown option " + flag);
    process.exit(0);
  },
});

const scheduler = new Scheduler([promptTarget, promptWebcms, promptNodelib, promptTempurl, actionCreate]);

scheduler.run({
  projectname,
  folderpath,
  givenurl: template,
});
