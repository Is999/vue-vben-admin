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
        // 上传文件
        '/upload/': {
          target: 'http://www.admin.cc/upload/',
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
        // api 接口
        '/admin-api/': {
          target: 'http://www.admin.cc/admin/api/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/admin-api/`), ''),
        },
        // images 资源
        '/images/': {
          target: 'http://www.admin.cc/images/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/images/`), ''),
        },
        // 上传的文件资源
        '/uploads/': {
          target: 'http://www.admin.cc/uploads/',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(new RegExp(`^/uploads/`), ''),
        },
      },
      open: true, // 项目启动后，自动打开
      warmup: {
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
    },
  },
});
