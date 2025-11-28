import { defineConfig } from 'vite';

export default defineConfig({
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
      // TTS API代理，解决CORS问题
      '/api/tts': {
        target: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
        changeOrigin: true,
        rewrite: (path) => '', // 重写路径为空，因为target已经包含完整路径
        secure: true
      },
      // OSS音频文件代理，解决CORS问题
      // 动态处理不同OSS域名的请求
      '/api/audio': {
        target: 'http://dashscope-result-wlcb.oss-cn-wulanchabu.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/audio/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 允许跨域
            proxyReq.setHeader('Origin', '');
          });
        }
      }
    }
  }
});

