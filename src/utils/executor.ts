// 在child-process模块的exec、execSync执行前后添加一些输出和异常处理
import { execSync as es, exec as e } from 'child_process'
import logger from './logger.js'

export async function exec(commands: string[] | string, output = true) {
  commands = Array.isArray(commands) ? commands : [commands]
  if (!commands.length) return Promise.resolve()

  return Promise.all(commands.map(cmd => {
    return new Promise((res, rej) => {
      e(cmd, (err, stdout, stderr) => {
        if (err) {
          rej(stderr)
        }
        res(stdout)
      })
    })
  })).then(stdout => {
    output && logger.info(stdout)
  }).catch(stderr => {
    output && logger.error(stderr)
    throw new Error(stderr)
  })
}

export function execSync(commands: string[] | string, output = true) {
  const stdio = output ? 'inherit' : 'ignore'
  commands = Array.isArray(commands) ? commands : [commands]
  commands.forEach(cmd => {
    es(cmd, {
      stdio
    });
  })
}
