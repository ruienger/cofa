import Process from "src/core/process";
import { exec } from "src/utils/executor";
import logger from "src/utils/logger";
import processOutputMap from 'src/core/process/outputMap'
import { InitArguments } from "types/command";
import { name as depName } from "./clone_repo_prompt";

export const name = 'clone_repo'

export default new Process(name, {
  runner(...args: InitArguments) {
    const [_, path = '.'] = args
    const repoUrl = processOutputMap.get(depName)
    let fetchCommand = `git clone ${repoUrl} ${path}`

    exec('git --version', false).catch((e) => {
      logger.info('git is not supportted, switching to curl')
      fetchCommand = `curl --output ${path} ${repoUrl}`
    })

    logger.command(fetchCommand)
    return logger.loading(exec(fetchCommand, false), {
      text: `Cloning Template Repo from: ${repoUrl}`,
      succeed: `Successfully cloned into floder: ${path}`,
      fail: `Cloning failed with following reason: `
    })
  },
  needs: [{ name: depName }]
})