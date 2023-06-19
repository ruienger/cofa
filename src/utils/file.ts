import fs, { type PathLike } from "node:fs";
import prompts from 'prompts'

export async function mkdir(path: PathLike) {
  if (fs.existsSync(path)) {
    const overwrite = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `目录 ${path} 不为空，是否覆写该目录？`
    })

    if (!overwrite) throw new Error(`目录 ${path} 不为空`)
    fs.rmSync(path)
  }

  fs.mkdirSync(path)
}