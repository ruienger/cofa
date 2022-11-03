import { Command } from "commander";
import scheduler from 'src/actions/init/scheduler'

/** ruiengercli create floderName */
export default function (cmdr: Command) {
  return cmdr
    .command('init <projectname> [folder]', )
    .option('--default', 'init project with default configerations')
    .description('在指定的文件夹下创建项目')
    .action((...args) => {
      scheduler.run(...args)
    })
}