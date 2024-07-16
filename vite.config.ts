import { defineApplicationConfig } from '@vben/vite-config';

const APP_URL = 'http://www.admin.cc';

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
        // 上传文件
        '/upload/': {
          target: APP_URL,
          changeOrigin: true,
          ws: true,
        },
        // 根站
        '/admin/': {
          target: APP_URL,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/admin/`), ''),
        },
        // api 接口
        '/admin-api/': {
          target: APP_URL + '/admin/api/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/admin-api/`), ''),
        },
        // 静态资源
        '/static/': {
          target: APP_URL,
          changeOrigin: true,
          ws: true,
        },
        // 上传的文件资源
        '/uploads/': {
          target: APP_URL,
          changeOrigin: true,
          ws: true,
        },
      },
      open: true, // 项目启动后，自动打开
      warmup: {
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
    },
  },
});
