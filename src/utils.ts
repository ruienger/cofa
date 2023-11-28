import type { StandardProcessOutput } from "types/process";
import { get } from "node:https";
import { resolve } from "node:path";
import { exec as execute } from "node:child_process";
import { createWriteStream, promises, createReadStream } from "node:fs";
import confirm from "@inquirer/confirm";
import extract from "extract-zip";
import logger from "./logger";

export function isNodejsError(v: unknown): v is NodeJS.ErrnoException {
  return v instanceof Error;
}

/** 创建目录，如果目录已存在，则询问是否覆写 */
export async function mkdir(path: string) {
  await promises.mkdir(path, {
    recursive: true,
  });
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

/** 将`from`指向的文件的内容流入到`to`指向的文件或输出流 */
export async function pipe(
  from: NodeJS.ReadableStream | string,
  to: NodeJS.WritableStream | string = process.stdout
) {
  return new Promise((res, rej) => {
    if (typeof from === "string") {
      from = createReadStream(from);
    }
    if (typeof to === "string") {
      to = createWriteStream(to);
    }

    from.pipe(to).once("finish", res).once("error", rej);
  });
}

/** 解压目标压缩文件到指定目录 */
export async function unzip(zippath: string, dest: string) {
  await extract(zippath, {
    dir: dest,
  });
}

/** 克隆目标仓库到指定目录，尝试通过https或git下载 */
export async function clone(repo: StandardProcessOutput, dest: string) {
  const zippath = resolve(dest, "deleteme.zip");
  let stop = logger.spin(`download from ${repo.url}`);
  try {
    await fetch(repo.url, zippath);
    await unzip(zippath, dest);
    await rmrf(zippath);
    const contentpath = resolve(dest, `${repo.repo}-${repo.branch}`);
    await move(contentpath, dest);
    stop();
    logger.success("download successfully");
  } catch (e) {
    if (isNodejsError(e)) {
      stop();
      logger.failed("download failed. try using git clone");
      stop = logger.spin(`clone from ${repo.url}`);
      await exec(
        `git clone ${repo.host}/${repo.username}/${repo.repo} ${dest} --branch ${repo.branch}`
      );
      await rmrf(`${dest}/.git`);
      stop();
      logger.success("clone successfully");
    } else {
      stop();
      logger.failed("failed");
      throw e;
    }
  }
}

/** 获取目标地址的内容到`dest`路径所指的文件中 */
function fetch(url: string, dest: string) {
  return new Promise((res, rej) => {
    get(url, (response) => {
      const code = response.statusCode;
      if (code) {
        if (code >= 400) {
          rej(response.statusMessage);
        } else if (code >= 300) {
          // 资源重定向
          fetch(response.headers?.location as string, dest).then(res, rej);
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

/** 生成一个流程标准输出 */
export function generateStandardOutput(
  keywords: (string | boolean | undefined)[]
): StandardProcessOutput;
export function generateStandardOutput(
  gitinfo: Omit<StandardProcessOutput, "path" | "url">
): StandardProcessOutput;
export function generateStandardOutput(
  arg:
    | (string | boolean | undefined)[]
    | Omit<StandardProcessOutput, "path" | "url">
): StandardProcessOutput {
  const output: StandardProcessOutput = Array.isArray(arg)
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
    : {
        ...arg,
        path: "",
        url: "",
      };

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
export function exec(cmd: string): Promise<{ stdout: string; stderr: string }> {
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

/** 强制删除，同rm -rf */
export async function rmrf(dirpath: string) {
  await promises.rm(dirpath, {
    recursive: true,
    force: true,
  });
}

/** 询问后尝试调用`git init` */
export async function gitinit(path: string, type: "github" | "gitlab") {
  const init = await confirm({
    message: "init git?",
  });
  if (init) {
    await exec(`git init ${path}`);

    const commitTemplate = resolve(path, `.${type}/templates/COMMIT_TEMP.md`);
    const issueTemplate = resolve(path, `.${type}/templates/ISSUE_TEMP.md`);
    try {
      await exec(
        `git config --file ${resolve(
          path,
          ".git/config"
        )} commit.template ${commitTemplate}`
      );
      await exec(
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
}
