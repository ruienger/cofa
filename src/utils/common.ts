import { execSync } from "./executor";
import { resolve } from "path";

/** typeof 加强版，支持判别 array 类型 */
export function realtypeof(target: any) {
  const originType = typeof target;
  return originType === "object" ? (Array.isArray(target) ? "array" : originType) : originType;
}

/** 判断两个参数的形式是否一致 */
export function same(target: any, source: any): boolean {
  const tType = realtypeof(target);
  const sType = realtypeof(source);
  if (tType !== sType) return false;
  if (tType === "function") return false;

  if (tType === "object") {
    return Object.keys(target).every((key: string) => {
      return same(target[key], source[key]);
    });
  }
  if (tType === "array") {
    return target.every((val: any, i: number) => same(val, source[i]));
  }
  return target === source;
}

export function gitClone(git: { url: string; branch: string }, projectname: string, floderpath: string) {
  execSync(`git clone ${git.url} -b ${git.branch} --bare`);
}
