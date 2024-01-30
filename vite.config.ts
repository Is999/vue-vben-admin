import { defineApplicationConfig } from '@vben/vite-config';

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
          target: 'http://127.0.0.1:9100/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/admin/`), ''),
        },
        '/admin-api/': {
          target: 'http://127.0.0.1:9100/admin/api/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/admin-api/`), ''),
        },
        '/images/': {
          target: 'http://127.0.0.1:9100/images/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/images/`), ''),
        },
      },
    },
  },
});
