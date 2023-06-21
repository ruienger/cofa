#!/usr/bin/env node
import mri from 'mri';
import prompts from 'prompts';
import { get } from 'node:https';
import { resolve } from 'node:path';
import { exec as exec$1 } from 'node:child_process';
import { existsSync, promises, createWriteStream } from 'node:fs';
import extract from 'extract-zip';

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
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

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
                console.warn(`Processes ${process.name} is duplicated and it will be skipped.`, "Please make sure that the Process's name is unique.");
            }
            else {
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
            const valid = keys[process.needsValidStrategy](key => {
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
    constructor(name, { runner, needs = {}, needsValidStrategy = 'every', }) {
        this.status = 'Idle';
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
            if (this.status !== 'Idle') {
                throw new Error(`Process ${this.name} is runned once!`);
            }
            this.status = 'Running';
            try {
                const result = yield this.runner(argv);
                return this.finish(result);
            }
            catch (e) {
                throw this.error(e);
            }
        });
    }
    /**
   * 标记该流程已放弃执行，流程状态由 **Running** 转为 **Abort**
   */
    abort() {
        if (this.status === 'Running') {
            this.status = 'Abort';
        }
    }
    /**
   * 标记该流程已完成并返回输出，流程状态由 **Running** 转为 **Finished**
   */
    finish(result) {
        if (this.status === 'Running') {
            this.status = 'Finished';
            this.output = result;
        }
        return result;
    }
    /**
   * 标记流程执行时发生错误，流程状态转为 **Error**
   */
    error(e) {
        this.status = 'Error';
        return e;
    }
}

const name$4 = "promptTarget";
var promptTarget = new Process(name$4, {
    runner({ givenurl }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (givenurl) {
                return "tempurl";
            }
            const answer = yield prompts([
                {
                    type: "select",
                    name: "target",
                    message: "选择代码模板类别",
                    choices: [
                        { title: "从**web端后台管理系统**类别里选择代码模板", value: "webcms" },
                        { title: "从**库**类别里选择代码模板", value: "nodelib" },
                        { title: "从我指定的url那里下载代码模板", value: "tempurl" },
                    ],
                },
            ]);
            return answer.target;
        });
    },
});

const nullOfTheseChoice = { title: "不使用", value: null };

/** 创建目录，如果目录已存在，则询问是否覆写 */
function mkdir(path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (existsSync(path)) {
            const { overwrite } = yield prompts({
                type: "toggle",
                name: "overwrite",
                message: `folder ${path} already exist, overwrite?`,
                active: "yes",
                inactive: "no",
                initial: true,
            });
            if (!overwrite)
                throw new Error("overwrite not allowed");
            yield rmrf(path);
        }
        yield promises.mkdir(path);
    });
}
/** 移动目标目录里的文件到指定目录中，覆写已存在的文件 */
function move(targetdir, destdir) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield promises.readdir(targetdir);
        files.forEach((name) => __awaiter(this, void 0, void 0, function* () {
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
        }));
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
/** 克隆目标仓库到指定目录，尝试通过https下载 */
function clone(repo, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        const stop = spin(`cloning repo into ${dest}`);
        return new Promise((res, rej) => {
            let url;
            if (typeof repo === "string") {
                url = repo;
            }
            else {
                url = `${repo.location}/${repo.username}/${repo.repo}/archive/refs/heads/${repo.branch}.zip`;
            }
            get(url, (response) => {
                var _a;
                const code = response.statusCode;
                if (code) {
                    if (code >= 400) {
                        rej(response.statusMessage);
                    }
                    else if (code >= 300) {
                        // 资源重定向
                        clone((_a = response.headers) === null || _a === void 0 ? void 0 : _a.location, dest).then(res, rej);
                    }
                    else {
                        response.pipe(createWriteStream(dest)).once("finish", res).once("error", rej);
                    }
                }
            }).once("error", rej);
        }).finally(stop);
    });
}
/** 生成一个流程标准输出 */
function generateStandardOutput(keywords) {
    return {
        location: "https://github.com",
        username: "ruienger",
        repo: "repo-templates",
        branch: keywords.join("_").replace("__", "_"),
    };
}
/** 执行一个命令 */
function exec(cmd) {
    return new Promise((res, rej) => {
        exec$1(cmd, (err, stdout, stderr) => {
            if (err)
                return rej(err);
            return res({
                stdout,
                stderr,
            });
        });
    });
}
function rmrf(dirpath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield promises.rm(dirpath, {
            recursive: true,
            force: true,
        });
    });
}
function spin(message) {
    const arr = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let index = 0;
    const interval = setInterval(() => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`${arr[index]} ${message}`);
        index = index === arr.length - 1 ? 0 : index + 1;
    }, 100);
    return function stop() {
        clearInterval(interval);
    };
}

const name$3 = "promptWebcms";
var promptWebcms = new Process(name$3, {
    runner() {
        return __awaiter(this, void 0, void 0, function* () {
            let componentlib = "";
            const prefix = this.input.promptTarget;
            const answer = yield prompts([
                {
                    type: "select",
                    name: "framework",
                    message: "选择您想要使用的web端框架",
                    choices: [{ title: "React", value: "react" }, { title: "Vue3", value: "vue3" }, { title: "Vue2", value: "vue2" }, { title: "Angular", value: "angular" }, nullOfTheseChoice],
                },
                {
                    type: "select",
                    name: "graphiclib",
                    message: "选择您想要使用的可视化库",
                    choices: [{ title: "ECharts", value: "echarts" }, { title: "D3JS", value: "d3" }, { title: "AntV", value: "antv" }, { title: "Cesium", value: "cesium" }, nullOfTheseChoice],
                },
                {
                    type: "toggle",
                    name: "typescript",
                    message: "是否使用typescript?",
                    initial: true,
                    active: "yes",
                    inactive: "no",
                    format: (use) => (use ? "ts" : ""),
                },
            ]);
            if (answer.framework) {
                const choices = new Map([
                    [
                        "vue3",
                        [
                            { title: "Element-Plus", value: "eleplus" },
                            { title: "ViewUI", value: "view" },
                        ],
                    ],
                    [
                        "vue2",
                        [
                            { title: "Element-UI", value: "eleui" },
                            { title: "IView", value: "iview" },
                        ],
                    ],
                ]);
                componentlib = yield prompts([
                    {
                        type: "select",
                        name: "componentlib",
                        message: "选择您想要使用的组件库",
                        choices: (choices.get(answer.framework) || []).concat(nullOfTheseChoice),
                    },
                ]).then((ans) => ans.componentlib);
            }
            const { typescript, graphiclib, framework } = answer;
            return generateStandardOutput([prefix, framework, graphiclib, typescript, componentlib]);
        });
    },
    needs: {
        promptTarget: (output) => {
            return output === "webcms";
        },
    },
});

const name$2 = "promptNodelib";
var promptNodelib = new Process(name$2, {
    runner() {
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = this.input.promptTarget;
            const answer = yield prompts([
                {
                    type: "select",
                    name: "buildlib",
                    message: "选择您想要使用的打包库",
                    choices: [{ title: "RollUp", value: "rollup" }, { title: "Vite", value: "vite" }, nullOfTheseChoice],
                },
                {
                    type: "toggle",
                    name: "typescript",
                    message: "是否使用typescript?",
                    initial: true,
                    active: "yes",
                    inactive: "no",
                    format: (use) => (use ? "ts" : ""),
                },
            ]);
            const { typescript, buildlib } = answer;
            return generateStandardOutput([prefix, buildlib, typescript]);
        });
    },
    needs: {
        promptTarget: (output) => {
            return output === "nodelib";
        },
    },
});

const name$1 = "promptTempurl";
var promptTempurl = new Process(name$1, {
    runner({ givenurl }) {
        return __awaiter(this, void 0, void 0, function* () {
            // (https://github.com)/(user)/(repo)(#(branch))?
            const reg = /^(https:\/\/github\.com)\/([\w-]+)\/([\w-]+)(\#([\w-]+))?$/;
            if (!givenurl) {
                const { url } = yield prompts([
                    {
                        type: "text",
                        name: "url",
                        message: "输入代码模板url，例如：https://github.com/user/repo#branch?",
                        validate: (prev) => {
                            return reg.test(prev);
                        },
                    },
                ]);
                givenurl = url;
            }
            const match = reg.exec(givenurl);
            if (!match)
                throw new Error("given url do not match the standard rule");
            return {
                location: match[1],
                username: match[2],
                repo: match[3],
                branch: match[5] || "master",
            };
        });
    },
    needs: {
        promptTarget: (output) => {
            return output === "tempurl";
        },
    },
});

const name = "actionCreate";
var actionCreate = new Process(name, {
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
            if (!output)
                throw new Error("output is not standard type");
            const targetpath = resolve(folderpath, projectname);
            const zippath = resolve(targetpath, "deleteme.zip");
            const contentpath = resolve(targetpath, `${output.repo}-${output.branch}`);
            // 下载git压缩包然后为用户配置基本内容
            yield mkdir(targetpath);
            yield clone(output, zippath);
            yield unzip(zippath, targetpath);
            yield rmrf(zippath);
            yield move(contentpath, targetpath);
            yield exec(`cd ${targetpath} && git init`);
            console.log("项目创建完成，在终端输入以下命令以启动：");
            console.log("$ cd " + targetpath);
            console.log("$ npm i");
            console.log("$ npm run dev");
        });
    },
    needs: {
        promptWebcms: () => true,
        promptNodelib: () => true,
        promptTempurl: () => true,
    },
    needsValidStrategy: "some",
});

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
const { _: [projectname = "cofa-creation", folderpath = ""], template, } = mri(argv, {
    alias: {
        t: "template",
    },
    unknown(flag) {
        console.log("unknown option " + flag);
        process.exit(0);
    },
});
const scheduler = new Scheduler([promptTarget, promptWebcms, promptNodelib, promptTempurl, actionCreate]);
scheduler.run({
    projectname,
    folderpath,
    givenurl: template,
});
