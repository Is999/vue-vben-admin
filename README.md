<div align="center"> <a href="https://github.com/anncwb/vue-vben-admin"> <img alt="VbenAdmin Logo" width="200" height="200" src="https://anncwb.github.io/anncwb/images/logo.png"> </a> <br> <br>

[![license](https://img.shields.io/github/license/anncwb/vue-vben-admin.svg)](LICENSE)

<h1>Vue vben admin</h1>
</div>

**English** | [中文](./README.zh-CN.md)

Vue vben admin 请阅读中文文档

该项目添加或变更配置说明:

1. 代理配置 vite.config.ts

   1. 上传文件

      ```
      '/upload/': {
        target: 'http://www.admin.cc',
        changeOrigin: true,
        ws: true,
      }
      ```

   2. API 接口

      ```
      '/admin-api/': {
        target: 'http://www.admin.cc/admin/api/',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(new RegExp(`^/admin-api/`), ''),
      }
      ```

   3. 静态资源

      ```
      '/static/': {
        target: 'http://www.admin.cc',
        changeOrigin: true,
        ws: true,
      }
      ```

   4. 上传的文件资源

      ```
      '/uploads/': {
        target: 'http://www.admin.cc',
        changeOrigin: true,
        ws: true,
      }
      ```

   5. 根站

      ```
      '/admin/': {
        target: 'http://www.admin.cc/',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(new RegExp(`^/admin/`), ''),
      }
      ```

2. .env 配置(这里.env.development为例)

   ```
   # public path
   VITE_PUBLIC_PATH = /

   # Basic interface address SPA
   VITE_GLOB_API_URL = /admin

   # File upload address， optional
   VITE_GLOB_UPLOAD_URL= /upload

   # Interface prefix
   VITE_GLOB_API_URL_PREFIX=

   # AppId
   VITE_APP_ID=

   # AES KEY
   VITE_AES_KEY=

   # AES IV
   VITE_AES_IV=

   # RSA Private Key
   VITE_RSA_PRIVATE_KEY=''

   # RSA Public Key
   VITE_RSA_PUBLIC_KEY=''

   # RSA Server Public Key
   VITE_RSA_PUBLIC_KEY_SERVER=''
   ```

3.
