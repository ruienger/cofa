export type R2pucCommands = 'build' | 'dev' | 'init' | 'config' | 'test'

export type CommandStatus = 'pre' | 'post' | ''

export type InitArguments = [string, string?, { default: boolean }?]