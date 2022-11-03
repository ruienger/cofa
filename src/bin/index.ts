#!/usr/bin/env node

import { Command } from 'commander'
import createMixin from '../command/init'
const program = new Command('ruienger-cli')

createMixin(program.version('0.0.1'))

program.parse()
