import Process from "src/core/process";
import { exec } from "src/utils/executor";
import logger from "src/utils/logger";
import processOutputMap from 'src/core/process/outputMap'
import { InitArguments } from "types/command";
import { name as depName } from "./npm_init_prompt";

export default new Process('npm_init', {
  runner(...args: InitArguments) {
    const [_, path = '.'] = args
    const byDefault = processOutputMap.get(depName)
    let initCommand = `npm init -w ${path}` + (byDefault ? ' -y' : '')

    logger.command(initCommand)
    return exec(initCommand)
  },
  needs: [{ name: depName }]
})