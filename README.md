<div align="center"> <a href="https://github.com/anncwb/vue-vben-admin"> <img alt="VbenAdmin Logo" width="200" height="200" src="https://anncwb.github.io/anncwb/images/logo.png"> </a> <br> <br>

[![license](https://img.shields.io/github/license/anncwb/vue-vben-admin.svg)](LICENSE)

<h1>Vue vben admin</h1>
</div>

**English** | [中文](./README.zh-CN.md)

Vue vben admin 请阅读中文文档

后端接口服务使用 https://github.com/Is999/laravel-admin，相关配置请阅读README.md

该项目添加或变更配置说明:

1. 代理配置 vite.config.ts

   1. 上传文件

      ```
      '/upload/': {
        target: APP_URL,
        changeOrigin: true,
        ws: true,
      }
      ```

   2. API 接口

      ```
      '/basic-api/': {
        target: APP_URL,
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(new RegExp(`^/basic-api/`), ''),
      }
      ```

   3. 静态资源

      ```
      '/static/': {
        target: APP_URL,
        changeOrigin: true,
        ws: true,
      }
      ```

   4. 上传的文件资源

      ```
      '/uploads/': {
        target: APP_URL,
        changeOrigin: true,
        ws: true,
      }
      ```

2. .env 配置(这里.env.development为例)

   ```
   # public path
   VITE_PUBLIC_PATH = /

   # Basic interface address SPA
   VITE_GLOB_API_URL = /basic-api

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

3. 接口支持数据签名、响应数据验签、数据加密、响应数据解密（可参考登录接口）

   1. 加密方式

      ```
      cryptoType: 'A', // 加密方式 A: AES加密、解密；R: RSA加密、解密
      ```

   2. 加密数据，支持全部数据加密，和部分参数加密

      ```
      cipherParams: 'cipher', // 全部参数加密

      cipherParams: ['name', 'password'], // 部分参数加密
      ```

   3. 签名方式

      ```
      signatureType: 'R', // 签名方式 M: MD5签名、验签；A: AES签名、验签；R: RSA签名、验签
      ```

   4. 签名参数和验证签名参数

      ```
      signParams: {
        request: ['name', 'password'], // 请求参数签名
        response: ['token'], // 响应验证签名参数
      },
      ```

4. 菜单支持后台菜单（需打开菜单接口src/api/sys/menu.ts），（当前使用及推荐模式）也支持前端菜单src/router/routes/modules下配置菜单

5. 权限使用后台权限加角色模式，按钮控制权限配置（src/enums/permissionsEnum.ts）
