export type CofaCommandsArgs = {
  create: {
    projectname: string;
    floderpath: string;
  };
};

export type CofaCommands = keyof CofaCommandsArgs;
