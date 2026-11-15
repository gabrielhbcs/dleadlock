import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { pipelinePlugin } from './dev/pipelinePlugin';

export default defineConfig(({ mode }) => ({
  // Relative base so the build works on GitHub Pages under any repo path.
  base: './',
  plugins: [react(), ...(mode === 'debug' ? [pipelinePlugin()] : [])],
}));
