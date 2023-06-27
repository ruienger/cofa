import type { StandardProcessOutput } from "types/process";
import { get } from "node:https";
import { resolve } from "node:path";
import { exec as execute } from "node:child_process";
import { createWriteStream, promises, createReadStream } from "node:fs";
import confirm from "@inquirer/confirm";
import extract from "extract-zip";

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
  const stop = spin(`下载${repo.url}`);
  try {
    await fetch(repo.url, zippath);
    await unzip(zippath, dest);
    await rmrf(zippath);
  } catch (e) {
    if (isNodejsError(e)) {
      await exec(
        `git clone ${repo.host}/${repo.username}/${repo.repo} ${dest} --branch ${repo.branch}`
      );
      await rmrf(`${dest}/.git`);
    } else {
      throw e;
    }
  } finally {
    stop();
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

/** 在终端显示旋转图案以及加载状态对应的信息 */
export function spin(msg: string) {
  let index = 0;
  const arr = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const maxlen = process.stdout.columns;

  const write = (str: string) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(
      str.length > maxlen ? `${str.slice(0, maxlen - 6)}......` : str
    );
  };

  const interval = setInterval(() => {
    write(`${arr[index]} ${msg}`);
    index = index === arr.length - 1 ? 0 : index + 1;
  }, 100);

  return function stop(msg: string = "") {
    clearInterval(interval);
    write(msg);
  };
}

/** 询问后尝试调用`git init` */
export async function gitinit(path: string, type: string) {
  const init = await confirm({
    message: "初始化git?",
  });
  if (init) {
    const tempDest = resolve(path, `.${type}/COMMIT_TEMP.md`);
    await exec(`git init ${path}`);
    await pipe(resolve(process.cwd(), ".github/templates/COMMIT.md"), tempDest);
    await exec(
      `git config --file ${resolve(
        path,
        ".git/config"
      )} commit.template ${tempDest}`
    );
  }
}

function ask<T extends string>(c: { c: T[] }): T {
  return c.c[0];
}

ask({ c: ["1", "2"] });
