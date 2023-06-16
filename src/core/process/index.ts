import { CofaCommands, CofaCommandsArgs } from "types/command";
import { ProcessInput, ProcessNeeds, ProcessOutput, ProcessOutputTypeMap } from "types/process";

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
 *    type: 'every', // every | some 决定这些依赖是或关系还是并关系
 *    example1: (boo) => boo // 返回true则为条件允许，boo为依赖的输出
 *  }
 * })
 */
export default class Process<O extends keyof ProcessOutputTypeMap, C extends CofaCommands> {
  /** 流程名称 */
  readonly name: string;

  /** 流程状态 */
  public status: "Idle" | "Running" | "Abort" | "Finished" | "Error";

  /** 流程执行所依赖的流程 */
  readonly needs: ProcessNeeds;

  /** 流程执行后的输出 */
  public output?: ProcessOutput<O>;

  public input: ProcessInput<keyof typeof this.needs>;

  readonly runner;

  readonly needsValidStrategy: "some" | "every";

  constructor(
    name: string,
    {
      runner,
      needs = {},
      needsValidStrategy = "every",
    }: {
      /**
       * 流程运行器
       *
       * 默认行为下，流程的`run`方法将调用它，它指明了流程运行时要做的事情。
       *
       * @description `runner`中如要使用 *this* 来操作其Process实例，则`runner`不能为箭头函数
       *
       * @example
       * runner() {
       *  logger.info(`${this.name} process is running`)
       *  return true // any results
       * }
       *
       * // 放弃该流程的执行结果，放弃后依赖它的其他流程不会执行
       * runner() {
       *    this.abort()
       *    return false // any results
       * }
       */
      runner: (this: Process<O, C>, args: CofaCommandsArgs[C]) => Promise<ProcessOutputTypeMap[O]>;
      /** 流程运行前的依赖流程 */
      needs?: ProcessNeeds;
      /** 校验依赖的策略 */
      needsValidStrategy?: "some" | "every";
    }
  ) {
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
  public async run(args: CofaCommandsArgs[C]): Promise<ProcessOutputTypeMap[O]> {
    if (this.status !== "Idle") {
      throw new Error(`Process ${this.name} is runned once!`);
    }

    this.status = "Running";
    try {
      const result = await this.runner.call(this, args);
      return this.finish(result);
    } catch (e) {
      return this.error(e);
    }
  }

  /**
   * 标记该流程已放弃执行，流程状态由 **Running** 转为 **Abort**
   */
  public abort(): void {
    if (this.status === "Running") this.status = "Abort";
  }

  /**
   * 标记该流程已完成并返回输出，流程状态由 **Running** 转为 **Finished**
   */
  protected finish<R>(result: R): R {
    if (this.status === "Running") {
      this.status = "Finished";
      this.output = result;
    }
    return result;
  }

  /**
   * 标记流程执行时发生错误，流程状态转为 **Error**
   */
  protected error(e: unknown): void {
    this.status = "Error";
    throw e;
  }
}
