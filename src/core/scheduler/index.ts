import logger from "src/utils/logger";
import { same } from "src/utils/common";
import { ProcessNeeds } from "types/process";
import Process from "../process";
import processOutputMap from "../process/outputMap"

/**
 * 调度器类，负责调度一系列流程有序的执行
 * 
 * @todo 调度器执行执行队列时支持worker选项以加快速度
 */
export default class Scheduler {
  /** 调度器可调度的流程 */
  readonly processes: Map<string, Process> = new Map();

  /** *process.name* 与 *process.needs* 的映射表 */
  protected registeredProcesses: Map<string, ProcessNeeds> = new Map();

  /** 可运行的流程组成的执行队列 */
  protected executeQueue: string[] = [];

  /** 已运行完成的流程 */
  protected finishedProcesses: Set<string> = new Set();

  constructor(processes: Process<any>[]) {
    processes.forEach(process => {
      if (this.processes.has(process.name)) {
        logger.warn(
          `Processes ${process.name} is duplicated and it will be skipped.`,
          "Please Make sure that the Process's name is unique."
        )
      } else {
        this.processes.set(process.name, process)
      }
    })
  }

  /**
   * 注册调度器中 *process.name* 和 *process.needs* 的映射关系，注册完毕后，可以通过流程名访问其所需
   */
  private registerProcesses(): void {
    this.processes.forEach(process => {
      this.registeredProcesses.set(process.name, process.needs)
    })
  }

  /**
   * 刷新执行队列
   * 
   * 检查目前已注册的流程中有没有可以执行的流程，如果有则解除注册并加入队列
   */
  private flushExecuteQueue(): void {
    this.registeredProcesses.forEach((needs, name) => {
      if (needs.every(need => {
        const finished = this.finishedProcesses.has(need.name)
        const outputMatched = need.output === undefined ?
          true :
          same(processOutputMap.get(need.name), need.output)
        return finished && outputMatched
      })) {
        this.registeredProcesses.delete(name)
        this.executeQueue.push(name)
      }
    })
  }

  /**
   * 执行执行队列
   * 
   * 执行完队列中首个流程后，尝试刷新调度器的执行队列并继续执行，直至所有队列中的流程执行完毕
   * 
   * @description 流程执行后，如果该流程状态为 **Abort** 则不计入已完成流程并且继续尝试执行
   * @description 流程执行后，如果该流程抛出出错，调度器不予处理并继续尝试执行
   */
  private async execute(...args: any[]): Promise<void> {
    if (!this.executeQueue.length) {
      logger.info(`All processes are done runnning.`)
      return Promise.resolve()
    } else {
      const name = this.executeQueue.shift() as string
      const process = this.processes.get(name) as Process
      try {
        await process.run(...args)
        if (process.status === 'Finished') {
          this.finishedProcesses.add(name);
        }
      } catch (e) {
        // 错误交由流程自己处理
      }
      this.flushExecuteQueue();
      return this.execute(...args)
    }
  }

  /**
   * 启动调度器
   */
  run(...args: any[]): Promise<void> {
    this.registerProcesses()
    this.flushExecuteQueue()
    return this.execute(...args)
  }
}