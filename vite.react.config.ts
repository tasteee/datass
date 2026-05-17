import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: './dist',
    lib: {
      entry: path.resolve(__dirname, 'src/react.ts'),
      name: 'datassReact',
      formats: ['es', 'cjs'],
      fileName: (format) => `react.${format === 'es' ? 'esm.js' : 'cjs'}`
    },
    minify: 'terser',
    terserOptions: {
      keep_classnames: true,
      keep_fnames: true,
      format: {
        comments: /^!/
      }
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
