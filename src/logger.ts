const FMT = {
  end: "\x1B[0m", // 结束
  bright: "\x1B[1m", // 亮色
  grey: "\x1B[2m", // 灰色
  italic: "\x1B[3m", // 斜体
  underline: "\x1B[4m", // 下划线
  reverse: "\x1B[7m", // 反向
  hidden: "\x1B[8m", // 隐藏
  black: "\x1B[30m", // 黑色
  red: "\x1B[31m", // 红色
  green: "\x1B[32m", // 绿色
  yellow: "\x1B[33m", // 黄色
  blue: "\x1B[34m", // 蓝色
  magenta: "\x1B[35m", // 品红
  cyan: "\x1B[36m", // 青色
  white: "\x1B[37m", // 白色
  blackBG: "\x1B[40m", // 背景色为黑色
  redBG: "\x1B[41m", // 背景色为红色
  greenBG: "\x1B[42m", // 背景色为绿色
  yellowBG: "\x1B[43m", // 背景色为黄色
  blueBG: "\x1B[44m", // 背景色为蓝色
  magentaBG: "\x1B[45m", // 背景色为品红
  cyanBG: "\x1B[46m", // 背景色为青色
  whiteBG: "\x1B[47m", // 背景色为白色
};

export class Logger {
  /** 即 console.log */
  log(...args: unknown[]) {
    console.log(...args);
  }
  /** 在终端显示成功语句 */
  success(msg: string) {
    this.log(`${FMT.green}√${FMT.end} %s`, msg);
  }
  /** 在终端显示错误语句 */
  failed(msg: string) {
    this.log(`${FMT.red}×${FMT.end} %s`, msg);
  }
  error(msg: string) {
    this.log(`${FMT.redBG}ERR${FMT.end} %s`, msg);
  }
  /** 在终端显示命令语句 */
  command(msg: string) {
    this.log(`${FMT.green}>${FMT.end} %s`, msg);
  }
  /** 在终端显示问题语句 */
  question(msg: string) {
    this.log(`${FMT.blue}?${FMT.end} %s`, msg);
  }
  /** 在终端显示OK语句 */
  ok(msg: string) {
    this.log(`${FMT.greenBG}OK${FMT.end} %s`, msg);
  }
  /** 在终端显示链接 */
  link(msg: string) {
    this.log(`${FMT.cyanBG}LINK${FMT.end} ${FMT.underline}%s${FMT.end}`, msg);
  }
  /** 在终端显示旋转图案以及加载状态对应的信息 */
  spin(msg: string) {
    let index = 0;
    const arr = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const maxlen = process.stdout.columns;

    // 清空标准输出并输出处理过的字符
    const write = (str: string) => {
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

export default logger;
