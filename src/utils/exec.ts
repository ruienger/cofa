import childProcess from "node:child_process"

export function exec(cmds: string[]) {
  return Promise.all(
    cmds.map(cmd => {
      return new Promise((res, rej) => {
        childProcess.exec(cmd, (error, stdout, stderr) => {
          if (error) {
            return rej(error)
          }
          return res({ stdout, stderr })
        })
      })
    })
  )
}