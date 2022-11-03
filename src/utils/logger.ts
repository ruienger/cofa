import chalk from 'chalk'
import ora from 'ora'

const LINE_MAX_LENGTH = 40

/**
 * 日志类
 */
export class Logger {
  /**
   * 格式化即将输出的内容，例如：
   * 
   * format(['line1', 'line2'], 'NOTICE: ') // => \nNOTICE: line1 \nNOTICE: line2
   */
  private format(target: any[], prefix: string = '', suffix: string = '') {
    const result = target.map(t => {
      if (typeof t === 'string') {
        return '\n' + prefix + t + suffix
      }
      return t
    })

    return result
  }

  private padEnd(str: string, len = LINE_MAX_LENGTH, fill = '=') {
    return (str + ' ').padEnd(len, fill)
  }

  log(...args: any[]) {
    return console.log(...args)
  }

  info(...args: any[]) {
    return this.log(chalk.blue(
      ...this.format(args, 'INFO: ')
    ))
  }

  error(...args: any[]) {
    return this.log(chalk.red(
      ...this.format(args, 'ERROR: ')
    ))
  }

  warn(...args: any[]) {
    return this.log(chalk.yellow(
      ...this.format(args, 'WARN: ')
    ))
  }

  command(cmd: string) {
    this.log(chalk.yellowBright(`> ${this.padEnd(cmd)}`))
  }

  loading(promise: Promise<unknown>, {
    text = 'loading...',
    succeed = 'promise resloved',
    fail = 'promise rejected'
  }: {
    text: string,
    succeed: string,
    fail: string,
  }) {
    const spinner = ora({
      color: 'green',
      text
    }).start()

    promise.then(() => {
      spinner.succeed(succeed)
    }).catch(e => {
      spinner.fail(fail)
      throw new Error(e)
    })

    return promise
  }
}

export default new Logger()
