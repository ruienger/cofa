import type { StandardProcessOutput } from "types/process";
import { get } from "node:https";
import { resolve } from "node:path";
import { exec as execute } from "node:child_process";
import { existsSync, createWriteStream, promises } from "node:fs";
import prompts from "prompts";
import extract from "extract-zip";

/** 创建目录，如果目录已存在，则询问是否覆写 */
export async function mkdir(path: string) {
  if (existsSync(path)) {
    const { overwrite } = await prompts({
      type: "toggle",
      name: "overwrite",
      message: `folder ${path} already exist, overwrite?`,
      active: "yes",
      inactive: "no",
      initial: true,
    });
    if (!overwrite) throw new Error("overwrite not allowed");
    await rmrf(path);
  }
  await promises.mkdir(path);
}

/** 移动目标目录里的文件到指定目录中，覆写已存在的文件 */
export async function move(targetdir: string, destdir: string) {
  const files = await promises.readdir(targetdir);
  files.forEach(async (name) => {
    const tar = resolve(targetdir, name);
    const dst = resolve(destdir, name);
    const stat = await promises.stat(tar);
    if (stat.isDirectory()) {
      await promises.mkdir(dst);
      await move(tar, dst);
    }
    if (stat.isFile()) {
      await promises.rename(tar, dst);
    }
  });
  rmrf(targetdir);
}

/** 解压目标压缩文件到指定目录 */
export async function unzip(zippath: string, dest: string) {
  await extract(zippath, {
    dir: dest,
  });
}

/** 克隆目标仓库到指定目录，尝试通过https下载 */
export async function clone(repo: StandardProcessOutput | string, dest: string) {
  const stop = spin(`cloning repo into ${dest}`);
  return new Promise((res, rej) => {
    let url: string;
    if (typeof repo === "string") {
      url = repo;
    } else {
      url = `${repo.location}/${repo.username}/${repo.repo}/archive/refs/heads/${repo.branch}.zip`;
    }
    get(url, (response) => {
      const code = response.statusCode;
      if (code) {
        if (code >= 400) {
          rej(response.statusMessage);
        } else if (code >= 300) {
          // 资源重定向
          clone(response.headers?.location as string, dest).then(res, rej);
        } else {
          response.pipe(createWriteStream(dest)).once("finish", res).once("error", rej);
        }
      }
    }).once("error", rej);
  }).finally(stop);
}

/** 生成一个流程标准输出 */
export function generateStandardOutput(keywords: string[]): StandardProcessOutput {
  return {
    location: "https://github.com",
    username: "ruienger",
    repo: "repo-templates",
    branch: keywords.join("_").replace("__", "_"),
  };
}

/** 执行一个命令 */
export function exec(cmd: string) {
  return new Promise((res, rej) => {
    execute(cmd, (err, stdout, stderr) => {
      if (err) return rej(err);
      return res({
        stdout,
        stderr,
      });
    });
  });
}

export async function rmrf(dirpath: string) {
  await promises.rm(dirpath, {
    recursive: true,
    force: true,
  });
}

export function spin(message: string) {
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
