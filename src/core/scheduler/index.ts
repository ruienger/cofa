import logger from "src/utils/logger";
import Process from "../process";
import { CofaCommands, CofaCommandsArgs } from "types/command";

/**
 * 调度器类，负责调度一系列流程有序的执行
 *
 * @todo 调度器执行执行队列时支持worker选项以加快速度
 */
export default class Scheduler<C extends CofaCommands> {
  /** 调度器可调度的流程 */
  readonly processes: Map<string, Process<any, any>> = new Map();
  /** 已运行完成的流程 */
  private finishedProcesses: Set<string> = new Set();
  /** 闲置的流程组成的闲置队列 */
  private idleProcesses: Set<string> = new Set();
  /** 可运行的流程组成的执行队列 */
  private executeQueue: string[] = [];

  constructor(processes: Process<any, any>[]) {
    processes.forEach((process) => {
      if (this.processes.has(process.name)) {
        logger.warn(`Processes ${process.name} is duplicated and it will be skipped.`, "Please Make sure that the Process's name is unique.");
      } else {
        this.processes.set(process.name, process);
      }
    });
  }

  /**
   * 刷新执行队列
   *
   * 检查目前空闲的流程中有没有可以执行的流程，如果有则加入执行队列
   */
  private flushExecuteQueue(): void {
    this.idleProcesses.forEach((name) => {
      const process = this.processes.get(name) as Process<any, any>;
      const needs = process.needs;

      // 仅在流程所需的条件全部满足后将其加入执行队列
      const valid = Object.keys(needs)[process.needsValidStrategy]((key) => {
        if (this.finishedProcesses.has(key)) {
          const depOutput = this.processes.get(key)?.output;
          if (needs[key]!(depOutput)) {
            process.input[key] = depOutput;
            return true;
          }
        }
      });

      if (valid) {
        this.idleProcesses.delete(name);
        this.executeQueue.push(name);
      }
    });
  }

  /**
   * 执行执行队列
   *
   * 执行完队列中首个流程后，尝试刷新调度器的执行队列并继续执行，直至所有队列中的流程执行完毕
   *
   * @description 流程执行后，如果该流程状态为 **Abort** 则不计入已完成流程并且继续尝试执行
   * @description 流程执行后，如果该流程抛出出错，调度器不予处理并继续尝试执行
   */
  private async execute(args: CofaCommandsArgs[C]): Promise<void> {
    this.flushExecuteQueue();
    if (!this.executeQueue.length) {
      logger.info(`All processes are done runnning.`);
      return;
    } else {
      const name = this.executeQueue.shift()!;
      const process = this.processes.get(name)!;
      try {
        await process.run(args);
        if (process.status === "Finished") {
          this.finishedProcesses.add(process.name);
        }
      } catch (e) {
        throw e;
      }
      return this.execute(args);
    }
  }

  /**
   * 启动调度器
   */
  run(args: CofaCommandsArgs[C]): Promise<void> {
    this.processes.forEach((process) => {
      this.idleProcesses.add(process.name);
    });
    return this.execute(args);
  }
}
