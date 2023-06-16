#!/usr/bin/env node

import { Command } from "commander";
import createMixin from "../command/create";
import devMixin from "../command/dev";
import testMixin from "../command/test";
import buildMixin from "../command/build";
import configMixin from "../command/config";

const program = new Command("cofa");
program.version("0.0.1");

createMixin(program);
devMixin(program);
testMixin(program);
buildMixin(program);
configMixin(program);

program.parse();
