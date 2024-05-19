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
      component: '/admin/system/account/index',
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
      component: '/admin/system/permission/index',
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
      component: '/admin/system/menu/index',
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
      component: '/admin/system/config/index',
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
      component: '/admin/system/cache/index',
      meta: {
        title: 'routes.admin.system.cache',
        orderNo: 5,
        icon: 'ant-design:database-outlined',
        uniqId: PermissionsEnum.CacheNav,
      },
    },
    {
      path: 'secret-key',
      name: PermissionsEnum.UserlogNav,
      component: 'admin/system/secret-key/index',
      meta: {
        title: 'routes.admin.system.secret-key',
        orderNo: 6,
        icon: 'ant-design:safety-outlined',
        uniqId: PermissionsEnum.UserlogNav,
      },
    },
    {
      path: 'notice',
      name: PermissionsEnum.UserlogNav,
      component: 'admin/system/notice/index',
      meta: {
        title: 'routes.admin.system.notice',
        orderNo: 7,
        icon: 'ant-design:comment-outlined',
        uniqId: PermissionsEnum.UserlogNav,
      },
    },
    {
      path: 'files',
      name: PermissionsEnum.UserlogNav,
      component: 'admin/system/fils/index',
      meta: {
        title: 'routes.admin.system.files',
        orderNo: 7,
        icon: 'ant-design:file-image-outlined',
        uniqId: PermissionsEnum.UserlogNav,
      },
    },
    {
      path: 'userlog',
      name: PermissionsEnum.UserlogNav,
      component: 'admin/system/userlog/index',
      meta: {
        title: 'routes.admin.system.userlog',
        orderNo: 8,
        icon: 'ant-design:code-twotone',
        uniqId: PermissionsEnum.UserlogNav,
      },
    },
  ],
};

export default account;
