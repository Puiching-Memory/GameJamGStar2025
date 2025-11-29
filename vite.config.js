import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 使用相对路径，支持 file:// 协议打开
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // 开发环境：将 API 请求代理到后端 FastAPI 服务器
      '/api': {
        target: 'http://localhost:18000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173, // Vite 预览服务器默认端口
    open: true
  }
});

