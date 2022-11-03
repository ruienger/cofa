import logger from "src/utils/logger";
import { ProcessNeeds } from "types/process";
import processOutputMap from "./outputMap";

/**
 * 流程类，负责执行工作产出输出
 * 
 * @description 流程类定义了流程的名称、依赖以及运行器，它们通常在调度器的调度下工作
 * 
 * @example
 * // 最简单的Process，Process输出内容的类型为 runner 的返回值
 * const example = new Process<boolean>('example', {
 *  runner() {
 *    logger.info('hello world!')
 *    return true
 *  }
 * })
 * 
 * // runner 可以获取到命令的参数，例如`r2puc init my-first-project`
 * const process = new Process<boolean>('processName', {
 *  runner(projectname: string) {
 *    logger.info(`project ${projectname} has been successfully inited`)
 *    return true
 *  }
 * })
 * 
 * // 定义了依赖的Process，当且仅当example这个流程运行完且输出了true时才执行本流程
 * const postinit = new Process<string>('post-init', {
 *  runner() {
 *    return 'yes'
 *  },
 *  needs: [{ name: example.name, output: true }]
 * })
 */
export default class Process<T = unknown> {
  /** 流程名称 */
  readonly name: string;
  
  /** 流程状态 */
  public status: 'Idle' | 'Running' | 'Abort' | 'Finished' | 'Error' = 'Idle';
  
  /** 流程执行所依赖的流程 */
  readonly needs: ProcessNeeds = [];

  /** 流程执行后的输出 */
  public output?: T;

  readonly runner;

  constructor(name: string, {
    runner,
    needs = [],
  }: {
    /**
     * 流程运行器
     * 
     * 默认行为下，流程的`run`方法将调用它；
     * 它指明了流程运行时要做的事情，作为构造函数参数初始化是为了方便在不继承子类的情况下实现流程定义
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
    runner: (this: Process<T>, ...rest: any[]) => Promise<T>;
    /**
     * 流程运行前需要完成的流程们
     * 
     * 该流程仅会在 *needs* 中的全部流程执行完毕后再执行
     */
    needs?: ProcessNeeds;
  }) {
    this.name = name
    this.runner = runner
    this.needs = needs
    processOutputMap.set(name, null)
  }

  /**
   * 运行流程
   * 
   * 调用该流程的`runner`，流程状态由 **Idle** 转为 **Running**
   * 
   * @description 对于任何状态不为 **Idle** 的流程，该函数默认发出警告并返回 **void**
   */
  public async run(...rest: any[]): Promise<void | T> {
    if (this.status !== 'Idle') {
      logger.warn(`Process ${this.name} is busy or already been excuted.`)
      return
    }
    
    this.status = 'Running'
    try {
      return this.finish(await this.runner.call(this, ...rest))
    } catch(e) {
      return this.error(e)
    }
  };

  /**
   * 标记该流程已放弃执行，流程状态由 **Running** 转为 **Abort**
   */
  public abort(): void {
    if (this.status === 'Running') this.status = 'Abort'
  }

  /**
   * 标记该流程已完成并返回输出，流程状态由 **Running** 转为 **Finished**
   */
  protected finish(result: T): T {
    if (this.status === 'Running') {
      this.status = 'Finished'
      this.output = result
      processOutputMap.set(this.name, result)
    }
    return result
  }

  /**
   * 标记流程执行时发生错误，流程状态转为 **Error**
   */
  protected error(e: unknown): void {
    this.status = 'Error'
    throw e
  }
}