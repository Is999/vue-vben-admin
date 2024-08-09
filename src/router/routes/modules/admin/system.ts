import type { AppRouteModule } from '@/router/types';

import { PermissionsEnum } from '@/enums/permissionsEnum';

const account: AppRouteModule = {
  path: '/system',
  name: PermissionsEnum.SystmeDir,
  component: 'LAYOUT',
  redirect: '/system/user',
  meta: {
    icon: 'ion:settings-outline',
    title: 'routes.admin.system.moduleName',
    orderNo: 2,
    uniqId: PermissionsEnum.SystmeDir,
  },
  children: [
    {
      path: 'user',
      name: PermissionsEnum.AccountNav,
      component: () => import('@/views/admin/system/account/index.vue'),
      meta: {
        title: 'routes.admin.system.user',
        orderNo: 0,
        icon: 'ant-design:team-outlined',
        uniqId: PermissionsEnum.AccountNav,
      },
    },
    {
      path: 'role',
      name: PermissionsEnum.RoleNav,
      component: '/admin/system/role/index',
      meta: {
        title: 'routes.admin.system.role',
        orderNo: 1,
        icon: 'carbon:user-role',
        uniqId: PermissionsEnum.RoleNav,
      },
    },
    {
      path: 'permission',
      name: PermissionsEnum.PermissionNav,
      component: () => import('@/views/admin/system/permission/index.vue'),
      meta: {
        title: 'routes.admin.system.permission',
        orderNo: 2,
        icon: 'ant-design:idcard-twotone',
        uniqId: PermissionsEnum.PermissionNav,
      },
    },
    {
      path: 'menu',
      name: PermissionsEnum.MenuNav,
      component: () => import('@/views/admin/system/menu/index.vue'),
      meta: {
        title: 'routes.admin.system.menu',
        orderNo: 3,
        icon: 'ant-design:menu-outlined',
        uniqId: PermissionsEnum.MenuNav,
      },
    },
    {
      path: 'config',
      name: PermissionsEnum.ConfigNav,
      component: () => import('@/views/admin/system/config/index.vue'),
      meta: {
        title: 'routes.admin.system.config',
        orderNo: 4,
        icon: 'ant-design:profile-outlined',
        uniqId: PermissionsEnum.ConfigNav,
      },
    },
    {
      path: 'cache',
      name: PermissionsEnum.CacheNav,
      component: () => import('@/views/admin/system/cache/index.vue'),
      meta: {
        title: 'routes.admin.system.cache',
        orderNo: 5,
        icon: 'ant-design:database-outlined',
        uniqId: PermissionsEnum.CacheNav,
      },
    },
    {
      path: 'secret-key',
      name: PermissionsEnum.SecretKeyNav,
      component: () => import('@/views/admin/system/secret-key/index.vue'),
      meta: {
        title: 'routes.admin.system.secretKey',
        orderNo: 6,
        icon: 'ant-design:safety-outlined',
        uniqId: PermissionsEnum.SecretKeyNav,
      },
    },
    {
      path: 'notice',
      name: PermissionsEnum.NoticeNav,
      component: '/admin/system/notice/index',
      meta: {
        title: 'routes.admin.system.notice',
        orderNo: 7,
        icon: 'ant-design:comment-outlined',
        uniqId: PermissionsEnum.NoticeNav,
      },
    },
    {
      path: 'file',
      name: PermissionsEnum.FileNav,
      component: '/admin/system/file/index',
      meta: {
        title: 'routes.admin.system.file',
        orderNo: 7,
        icon: 'ant-design:file-image-outlined',
        uniqId: PermissionsEnum.FileNav,
      },
    },
    {
      path: 'user-log',
      name: PermissionsEnum.UserLogNav,
      component: () => import('@/views/admin/system/userlog/index.vue'),
      meta: {
        title: 'routes.admin.system.userLog',
        orderNo: 8,
        icon: 'ant-design:code-twotone',
        uniqId: PermissionsEnum.UserLogNav,
      },
    },
  ],
};

export default account;
