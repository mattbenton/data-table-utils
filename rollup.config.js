// rollup.config.js
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

export default defineConfig([
  {
    input: './src/index.ts',
    output: {
      dir: './dist/esm',
      format: 'esm'
    },
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: 'tsconfig.prod.json',
        outDir: './dist/esm'
      })
    ]
  },
  {
    input: './src/index.ts',
    output: {
      dir: './dist/cjs',
      format: 'cjs'
    },
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: 'tsconfig.prod.json',
        outDir: './dist/cjs'
      })
    ]
  }
]);
