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
      path: 'userlog',
      name: PermissionsEnum.UserlogNav,
      component: 'admin/system/userlog/index',
      meta: {
        title: 'routes.admin.system.userlog',
        orderNo: 6,
        icon: 'ant-design:code-twotone',
        uniqId: PermissionsEnum.UserlogNav,
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
      path: 'user',
      name: PermissionsEnum.AccountNav,
      component: '/admin/system/account/index',
      meta: {
        title: 'routes.admin.system.user',
        orderNo: 0,
        icon: 'ant-design:contacts-twotone',
        uniqId: PermissionsEnum.AccountNav,
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
      path: 'permission',
      name: PermissionsEnum.PermissionNav,
      component: '/admin/system/permission/index',
      meta: {
        title: 'routes.admin.system.permission',
        orderNo: 2,
        icon: 'carbon:user-role',
        uniqId: PermissionsEnum.PermissionNav,
      },
    },
    {
      path: 'role',
      name: PermissionsEnum.RoleNav,
      component: '/admin/system/role/index',
      meta: {
        title: 'routes.admin.system.role',
        orderNo: 1,
        icon: 'ant-design:idcard-twotone',
        uniqId: PermissionsEnum.RoleNav,
      },
    },
  ],
};

export default account;
