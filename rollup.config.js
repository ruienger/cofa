import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/bin/index.ts',
  output: {
    dir: 'disk',
    format: 'es',
    banner: '#!/usr/bin/env node'
  },
  plugins: [typescript()]
};