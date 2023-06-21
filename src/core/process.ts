import type { CofaArgv } from 'types/command';
import type { ProcessInput, ProcessName, ProcessNeeds, ProcessOutput, ProcessOutputMap, ProcessStatus } from 'types/process';

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
 *    // 执行下面的 abort 方法将本流程标为放弃，依赖它的流程不会再触发
 *    // this.abort()
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
 *    example1: (boo) => boo // 返回true则为条件允许，boo为依赖的输出
 *  },
 *  needsValidStrategy: 'every' // 判断依赖间关系的策略
 * })
 */
export default class Process<O extends ProcessName>  {
	/** 流程名称 */
	readonly name: ProcessName;

	/** 流程状态 */
	public status: ProcessStatus;

	/** 流程执行所依赖的流程 */
	readonly needs: ProcessNeeds;

	/** 流程执行后的输出 */
	public output?: ProcessOutput<O>;

	public input: ProcessInput;

	readonly runner;

	readonly needsValidStrategy: 'some' | 'every';

	constructor(
		name: O,
		{
			runner,
			needs = {},
			needsValidStrategy = 'every',
		}: {
      /** 流程运行器 */
      runner: (this: Process<O>, argv: CofaArgv) => Promise<ProcessOutputMap[O]>;
      /** 流程运行前的依赖流程 */
      needs?: ProcessNeeds;
      /** 校验依赖的策略 */
      needsValidStrategy?: 'some' | 'every';
    },
	) {
		this.status = 'Idle';
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
	public async run(argv: CofaArgv) {
		if (this.status !== 'Idle') {
			throw new Error(`Process ${this.name} is runned once!`);
		}

		this.status = 'Running';
		try {
			const result = await this.runner(argv);
			return this.finish(result);
		} catch (e) {
			throw this.error(e);
		}
	}

	/**
   * 标记该流程已放弃执行，流程状态由 **Running** 转为 **Abort**
   */
	public abort(): void {
		if (this.status === 'Running') {
			this.status = 'Abort';
		}
	}

	/**
   * 标记该流程已完成并返回输出，流程状态由 **Running** 转为 **Finished**
   */
	protected finish(result: ProcessOutputMap[O]) {
		if (this.status === 'Running') {
			this.status = 'Finished';
			this.output = result;
		}

		return result;
	}

	/**
   * 标记流程执行时发生错误，流程状态转为 **Error**
   */
	protected error(e: unknown): unknown {
		this.status = 'Error';
    return e
	}
}