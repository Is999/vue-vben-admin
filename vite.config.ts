import { defineApplicationConfig } from '@vben/vite-config';
import Inspector from 'vite-plugin-vue-inspector';

export default defineApplicationConfig({
  overrides: {
    optimizeDeps: {
      include: [
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'qrcode',
        '@iconify/iconify',
        'ant-design-vue/es/locale/zh_CN',
        'ant-design-vue/es/locale/en_US',
      ],
    },
    server: {
      proxy: {
        '/upload/': {
          target: 'http://127.0.0.1:9100/upload/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/upload/`), ''),
        },
        '/admin/': {
          target: 'http://www.admin.cc/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/admin/`), ''),
        },
        '/admin-api/': {
          target: 'http://www.admin.cc/admin/api/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/admin-api/`), ''),
        },
        '/images/': {
          target: 'http://www.admin.cc/images/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/images/`), ''),
        },
      },
      open: true, // 项目启动后，自动打开
      warmup: {
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
    },
    plugins: [
      Inspector({
        openInEditorHost: 'http://localhost:5173',
      }),
    ],
  },
});
