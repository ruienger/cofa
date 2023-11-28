#!/usr/bin/env node
import mri from "mri";
import select from "@inquirer/select";
import confirm from "@inquirer/confirm";
import { get } from "node:https";
import { resolve } from "node:path";
import { exec as exec$1 } from "node:child_process";
import { promises, createWriteStream } from "node:fs";
import extract from "extract-zip";
import input from "@inquirer/input";

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P
      ? value
      : new P(function (resolve) {
          resolve(value);
        });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done
        ? resolve(result.value)
        : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

const FMT = {
  end: "\x1B[0m",
  bright: "\x1B[1m",
  grey: "\x1B[2m",
  italic: "\x1B[3m",
  underline: "\x1B[4m",
  reverse: "\x1B[7m",
  hidden: "\x1B[8m",
  black: "\x1B[30m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m",
  blackBG: "\x1B[40m",
  redBG: "\x1B[41m",
  greenBG: "\x1B[42m",
  yellowBG: "\x1B[43m",
  blueBG: "\x1B[44m",
  magentaBG: "\x1B[45m",
  cyanBG: "\x1B[46m",
  whiteBG: "\x1B[47m", // 背景色为白色
};
class Logger {
  /** 即 console.log */
  log(...args) {
    console.log(...args);
  }
  /** 在终端显示成功语句 */
  success(msg) {
    this.log(`${FMT.green}√${FMT.end} %s`, msg);
  }
  /** 在终端显示错误语句 */
  failed(msg) {
    this.log(`${FMT.red}×${FMT.end} %s`, msg);
  }
  error(msg) {
    this.log(`${FMT.redBG}ERR${FMT.end} %s`, msg);
  }
  /** 在终端显示命令语句 */
  command(msg) {
    this.log(`${FMT.green}>${FMT.end} %s`, msg);
  }
  /** 在终端显示问题语句 */
  question(msg) {
    this.log(`${FMT.blue}?${FMT.end} %s`, msg);
  }
  /** 在终端显示OK语句 */
  ok(msg) {
    this.log(`${FMT.greenBG}OK${FMT.end} %s`, msg);
  }
  /** 在终端显示链接 */
  link(msg) {
    this.log(`${FMT.cyanBG}LINK${FMT.end} ${FMT.underline}%s${FMT.end}`, msg);
  }
  /** 在终端显示旋转图案以及加载状态对应的信息 */
  spin(msg) {
    let index = 0;
    const arr = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const maxlen = process.stdout.columns;
    // 清空标准输出并输出处理过的字符
    const write = (str) => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        str.length > maxlen ? `${str.slice(0, maxlen - 6)}......` : str + ""
      );
    };
    const interval = setInterval(() => {
      write(`${FMT.cyan}${arr[index]}${FMT.end} ${msg}`);
      index = index === arr.length - 1 ? 0 : index + 1;
    }, 100);
    return function stop() {
      clearInterval(interval);
      write("\n");
    };
  }
}
const logger = new Logger();

/**
 * 调度器类，负责调度一系列流程有序的执行
 *
 * @todo 调度器执行执行队列时支持worker选项以加快速度
 */
class Scheduler {
  constructor(processes) {
    /** 调度器可调度的流程 */
    this.processes = new Map();
    /** 已运行完成的流程 */
    this.finishedProcesses = new Set();
    /** 闲置的流程组成的闲置队列 */
    this.idleProcesses = new Set();
    /** 可运行的流程组成的执行队列 */
    this.executeQueue = [];
    processes.forEach((process) => {
      if (this.processes.has(process.name)) {
        logger.log(
          `Processes ${process.name} is duplicated and it will be skipped`,
          "Please make sure that the Process's name is unique"
        );
      } else {
        this.processes.set(process.name, process);
      }
    });
  }
  /**
   * 启动调度器
   */
  run(argv) {
    return __awaiter(this, void 0, void 0, function* () {
      this.processes.forEach((process) => {
        this.idleProcesses.add(process.name);
      });
      return this.execute(argv);
    });
  }
  /**
   * 刷新执行队列
   *
   * 检查目前空闲的流程中有没有可以执行的流程，如果有则加入执行队列
   */
  flushExecuteQueue() {
    this.idleProcesses.forEach((name) => {
      const process = this.processes.get(name);
      // 仅在流程所需的条件全部满足后将其加入执行队列
      const keys = Object.keys(process.needs);
      const valid = keys[process.needsValidStrategy]((key) => {
        if (this.finishedProcesses.has(key)) {
          const output = this.processes.get(key).output;
          if (process.needs[key](output)) {
            process.input[key] = output;
            return true;
          }
        }
        return false;
      });
      if (valid) {
        this.idleProcesses.delete(name);
        this.executeQueue.push(name);
      }
    });
  }
  /**
   * 执行执行队列
   *
   * 执行完队列中首个流程后，尝试刷新调度器的执行队列并继续执行，直至所有队列中的流程执行完毕
   *
   * @description 流程执行后，如果该流程状态为 **Abort** 则不计入已完成流程并且继续尝试执行
   * @description 流程执行后，如果该流程抛出出错，调度器不予处理并继续尝试执行
   */
  execute(argv) {
    return __awaiter(this, void 0, void 0, function* () {
      this.flushExecuteQueue();
      if (this.executeQueue.length) {
        const name = this.executeQueue.shift();
        const process = this.processes.get(name);
        yield process.run(argv);
        if (process.status === "Finished") {
          this.finishedProcesses.add(process.name);
        }
        yield this.execute(argv);
      }
    });
  }
}

/**
 * 流程类，负责执行工作产出输出
 *
 * @description 流程类定义了流程的名称、依赖以及运行器，它们通常在调度器的调度下工作
 *
 * 以下例子演示了如何创建在`cofa create`命令下的流程
 * @example
 * // 拓展类型映射表
 * interface ProcessOutputTypeMap {
 *  example1: boolean;
 *  example2: string;
 * }
 *
 * // 最简单的Process，两个泛型代表流程名、命令名。runner的参数为该命令输入的参数
 * const example1 = new Process<'example1', 'create'>('example1', {
 *  runner({ projectname }) {
 *    logger.info(`hello ${projectname}!`)
 *    // 执行下面的 abort 方法将本流程标为放弃，依赖它的流程不会再触发
 *    // this.abort()
 *    return true
 *  }
 * })
 *
 * // 定义了依赖的Process，当example1运行成功且条件允许时才执行本流程
 * const example2 = new Process<'example2', 'create'>('example2', {
 *  runner() {
 *    return 'yes'
 *  },
 *  needs: {
 *    example1: (boo) => boo // 返回true则为条件允许，boo为依赖的输出
 *  },
 *  needsValidStrategy: 'every' // 判断依赖间关系的策略
 * })
 */
class Process {
  constructor(name, { runner, needs = {}, needsValidStrategy = "every" }) {
    this.status = "Idle";
    this.input = {};
    this.name = name;
    this.runner = runner;
    this.needs = needs;
    this.needsValidStrategy = needsValidStrategy;
  }
  /**
   * 运行流程
   *
   * 调用该流程的`runner`，流程状态由 **Idle** 转为 **Running**
   *
   * @description 对于任何状态不为 **Idle** 的流程，该函数抛出错误
   */
  run(argv) {
    return __awaiter(this, void 0, void 0, function* () {
      if (this.status !== "Idle") {
        throw new Error(`Process ${this.name} is runned once!`);
      }
      this.status = "Running";
      try {
        const result = yield this.runner(argv);
        return this.finish(result);
      } catch (e) {
        throw this.error(e);
      }
    });
  }
  /**
   * 标记该流程已放弃执行，流程状态由 **Running** 转为 **Abort**
   */
  abort() {
    if (this.status === "Running") {
      this.status = "Abort";
    }
  }
  /**
   * 标记该流程已完成并返回输出，流程状态由 **Running** 转为 **Finished**
   */
  finish(result) {
    if (this.status === "Running") {
      this.status = "Finished";
      this.output = result;
    }
    return result;
  }
  /**
   * 标记流程执行时发生错误，流程状态转为 **Error**
   */
  error(e) {
    this.status = "Error";
    return e;
  }
}

const nullOfTheseChoice = { name: "null of these", value: undefined };
const notAvailable = "is not available yet";

const name$5 = "promptTarget";
var promptTarget = new Process(name$5, {
  runner({ givenurl }) {
    return __awaiter(this, void 0, void 0, function* () {
      if (givenurl) {
        return "tempurl";
      }
      const target = yield select({
        message: "what does this project targetting at",
        choices: [
          {
            name: "mobile application like",
            value: "mobileapp",
            disabled: notAvailable,
          },
          {
            name: "desktop application like",
            value: "pcapp",
            disabled: notAvailable,
          },
          { name: "web content management system like", value: "webcms" },
          { name: "web library like", value: "weblib", disabled: notAvailable },
          { name: "nodejs library like", value: "nodelib" },
          { name: "download template right from a git url", value: "tempurl" },
        ],
      });
      return target;
    });
  },
});

function isNodejsError(v) {
  return v instanceof Error;
}
/** 创建目录，如果目录已存在，则询问是否覆写 */
function mkdir(path) {
  return __awaiter(this, void 0, void 0, function* () {
    yield promises.mkdir(path, {
      recursive: true,
    });
  });
}
/** 移动目标目录里的文件到指定目录中，覆写已存在的文件 */
function move(targetdir, destdir) {
  return __awaiter(this, void 0, void 0, function* () {
    const files = yield promises.readdir(targetdir);
    files.forEach((name) =>
      __awaiter(this, void 0, void 0, function* () {
        const tar = resolve(targetdir, name);
        const dst = resolve(destdir, name);
        const stat = yield promises.stat(tar);
        if (stat.isDirectory()) {
          yield promises.mkdir(dst);
          yield move(tar, dst);
        }
        if (stat.isFile()) {
          yield promises.rename(tar, dst);
        }
      })
    );
    rmrf(targetdir);
  });
}
/** 解压目标压缩文件到指定目录 */
function unzip(zippath, dest) {
  return __awaiter(this, void 0, void 0, function* () {
    yield extract(zippath, {
      dir: dest,
    });
  });
}
/** 克隆目标仓库到指定目录，尝试通过https或git下载 */
function clone(repo, dest) {
  return __awaiter(this, void 0, void 0, function* () {
    const zippath = resolve(dest, "deleteme.zip");
    let stop = logger.spin(`download from ${repo.url}`);
    try {
      yield fetch(repo.url, zippath);
      yield unzip(zippath, dest);
      yield rmrf(zippath);
      const contentpath = resolve(dest, `${repo.repo}-${repo.branch}`);
      yield move(contentpath, dest);
      stop();
      logger.success("download successfully");
    } catch (e) {
      if (isNodejsError(e)) {
        stop();
        logger.failed("download failed. try using git clone");
        stop = logger.spin(`clone from ${repo.url}`);
        yield exec(
          `git clone ${repo.host}/${repo.username}/${repo.repo} ${dest} --branch ${repo.branch}`
        );
        yield rmrf(`${dest}/.git`);
        stop();
        logger.success("clone successfully");
      } else {
        stop();
        logger.failed("failed");
        throw e;
      }
    }
  });
}
/** 获取目标地址的内容到`dest`路径所指的文件中 */
function fetch(url, dest) {
  return new Promise((res, rej) => {
    get(url, (response) => {
      var _a;
      const code = response.statusCode;
      if (code) {
        if (code >= 400) {
          rej(response.statusMessage);
        } else if (code >= 300) {
          // 资源重定向
          fetch(
            (_a = response.headers) === null || _a === void 0
              ? void 0
              : _a.location,
            dest
          ).then(res, rej);
        } else {
          response
            .pipe(createWriteStream(dest))
            .once("finish", res)
            .once("error", rej);
        }
      }
    }).once("error", rej);
  });
}
function generateStandardOutput(arg) {
  const output = Array.isArray(arg)
    ? {
        type: "github",
        host: "https://github.com",
        username: "ruienger",
        repo: "repo-templates",
        branch: arg
          .filter((a) => Boolean(a))
          .join("_")
          .replace("__", "_"),
        path: "",
        url: "",
      }
    : Object.assign(Object.assign({}, arg), { path: "", url: "" });
  if (output.type === "github") {
    output.path = `${output.username}/${output.repo}/archive/refs/heads/${output.branch}.zip`;
  }
  if (output.type === "gitlab") {
    output.path = `${output.username}/${output.repo}/-/archive/${output.branch}/gitlab-${output.branch}.zip`;
  }
  output.url = `${output.host}/${output.path}`;
  return output;
}
/** 执行一个命令 */
function exec(cmd) {
  return new Promise((res, rej) => {
    exec$1(cmd, (err, stdout, stderr) => {
      if (err) return rej(err);
      return res({
        stdout,
        stderr,
      });
    });
  });
}
/** 强制删除，同rm -rf */
function rmrf(dirpath) {
  return __awaiter(this, void 0, void 0, function* () {
    yield promises.rm(dirpath, {
      recursive: true,
      force: true,
    });
  });
}
/** 询问后尝试调用`git init` */
function gitinit(path, type) {
  return __awaiter(this, void 0, void 0, function* () {
    const init = yield confirm({
      message: "init git?",
    });
    if (init) {
      yield exec(`git init ${path}`);
      const commitTemplate = resolve(path, `.${type}/templates/COMMIT_TEMP.md`);
      const issueTemplate = resolve(path, `.${type}/templates/ISSUE_TEMP.md`);
      try {
        yield exec(
          `git config --file ${resolve(
            path,
            ".git/config"
          )} commit.template ${commitTemplate}`
        );
        yield exec(
          `git config --file ${resolve(
            path,
            ".git/config"
          )} issue.template ${issueTemplate}`
        );
        logger.success("git templates has been successfully init.");
      } catch (e) {
        logger.failed("error occurs: ");
        logger.log(e);
      }
    }
  });
}

const name$4 = "promptWebcms";
var promptWebcms = new Process(name$4, {
  runner() {
    return __awaiter(this, void 0, void 0, function* () {
      const framework = yield select({
        message: "which framework preset would you like",
        choices: [
          {
            value: "vue3",
            name: "Vue3(vuerouter & pinia)",
          },
          {
            value: "vue2",
            name: "Vue2(vuerouter & vuex)",
            disabled: notAvailable,
          },
          {
            value: "react",
            name: "React",
            disabled: notAvailable,
          },
          nullOfTheseChoice,
        ],
      });
      const graphiclib = yield select({
        message: "which graphic lib would you like",
        choices: [
          {
            value: "echarts",
            name: "Echarts",
            disabled: notAvailable,
          },
          {
            value: "d3",
            name: "D3js",
            disabled: notAvailable,
          },
          {
            value: "cesium",
            name: "Cesium",
            disabled: notAvailable,
          },
          nullOfTheseChoice,
        ],
      });
      const onlyVue3 = framework === "vue3" ? false : notAvailable;
      // const onlyVue2 = framework === "vue2" ? false : notAvailable;
      const componentlib = yield select({
        message: "which ui lib would you like",
        choices: [
          {
            value: "eleplus",
            name: "Element-Plus",
            disabled: onlyVue3,
          },
          {
            value: "naiveui",
            name: "NaiveUI",
            disabled: onlyVue3,
          },
          {
            value: "view",
            name: "ViewUI",
            disabled: notAvailable,
          },
          {
            value: "eleui",
            name: "ElementUI",
            disabled: notAvailable,
          },
          {
            value: "iview",
            name: "IView",
            disabled: notAvailable,
          },
          nullOfTheseChoice,
        ],
      });
      const typescript = (yield confirm({
        message: "typescript support",
      }))
        ? "ts"
        : "";
      return generateStandardOutput([
        this.input.promptTarget,
        framework,
        graphiclib,
        typescript,
        componentlib,
      ]);
    });
  },
  needs: {
    promptTarget: (output) => {
      return output === "webcms";
    },
  },
});

const name$3 = "promptNodelib";
var promptNodelib = new Process(name$3, {
  runner() {
    return __awaiter(this, void 0, void 0, function* () {
      const buildlib = yield select({
        message: "which packager would you like",
        choices: [
          { name: "RollUp", value: "rollup" },
          { name: "Vite", value: "vite", disabled: notAvailable },
          nullOfTheseChoice,
        ],
      });
      const typescript = (yield confirm({
        message: "typescript support?",
      }))
        ? "ts"
        : "";
      return generateStandardOutput([
        this.input.promptTarget,
        buildlib,
        typescript,
      ]);
    });
  },
  needs: {
    promptTarget: (output) => {
      return output === "nodelib";
    },
  },
});

const name$2 = "promptTempurl";
var promptTempurl = new Process(name$2, {
  runner({ givenurl }) {
    return __awaiter(this, void 0, void 0, function* () {
      // (https://address)/(user)/(repo)(#(branch))?
      const reg = /^(https?:\/\/[\w-\.]+)\/([\w-]+)\/([\w-]+)(\#([\w-]+))?$/;
      const type = yield select({
        message: "download code from",
        choices: [
          { name: "github", value: "github" },
          { name: "gitlab", value: "gitlab" },
        ],
      });
      if (!givenurl) {
        givenurl = yield input({
          message:
            "input the repo url. e.g. https://github.com/user/repo#branch",
          validate: (prev) => {
            return reg.test(prev);
          },
        });
      } else if (!reg.test(givenurl)) {
        logger.failed(
          "given url do not match with the standard format. e.g. https://github.com/user/repo#branch"
        );
        throw new Error("format error");
      }
      const match = reg.exec(givenurl);
      return generateStandardOutput({
        type,
        host: match[1],
        username: match[2],
        repo: match[3],
        branch: match[5] || "master",
      });
    });
  },
  needs: {
    promptTarget: (output) => {
      return output === "tempurl";
    },
  },
});

const name$1 = "actionClone";
var actionClone = new Process(name$1, {
  runner({ projectname, folderpath }) {
    return __awaiter(this, void 0, void 0, function* () {
      let output = undefined;
      if (this.input.promptNodelib) {
        output = this.input.promptNodelib;
      }
      if (this.input.promptWebcms) {
        output = this.input.promptWebcms;
      }
      if (this.input.promptTempurl) {
        output = this.input.promptTempurl;
      }
      if (!output) {
        logger.error("internal: output is not a standard type");
        throw new Error("output error");
      }
      const targetpath = resolve(folderpath, projectname);
      // 下载git压缩包然后为用户配置基本内容
      yield mkdir(targetpath);
      yield clone(output, targetpath);
      return output;
    });
  },
  needs: {
    promptWebcms: () => true,
    promptNodelib: () => true,
    promptTempurl: () => true,
  },
  needsValidStrategy: "some",
});

const name = "actionInit";
var actionInit = new Process(name, {
  runner({ projectname, folderpath }) {
    return __awaiter(this, void 0, void 0, function* () {
      const output = this.input.actionClone;
      const targetpath = resolve(folderpath, projectname);
      yield gitinit(targetpath, output.type);
      yield exec(`npm pkg set name=${projectname}`);
      logger.success("project has been succuessfully init");
      logger.success("run these commands to continue");
      logger.command(`cd ${targetpath}`);
      logger.command("npm i");
      logger.command("npm run dev");
      logger.ok("HAPPY DEVELOPE");
      return output;
    });
  },
  needs: {
    actionClone: () => true,
  },
});

function main(argv) {
  return __awaiter(this, void 0, void 0, function* () {
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
      const { stdout, stderr } = yield exec("npm pkg get version");
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
  });
}
const argv = process.argv.slice(2);
main(argv);
