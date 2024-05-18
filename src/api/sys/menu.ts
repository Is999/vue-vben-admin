// import { AdminApi } from '@/api/api';
// import { getMenuListResultModel } from './model/menuModel';

import { AppRouteModule } from '@/router/types';
import { PermissionsEnum } from '@/enums/permissionsEnum';
import { LAYOUT } from '@/router/constant';
import { t } from '@/hooks/web/useI18n';

// enum Api {
//   GetMenuList = '/menu/nav',
// }

/**
 * @description: Get user menu based on id
 */

export const getMenuList = () => {
  return [
    {
      path: '/dashboard',
      name: PermissionsEnum.DashboardDir,
      component: LAYOUT,
      redirect: '/dashboard/analysis',
      meta: {
        orderNo: 10,
        icon: 'ion:grid-outline',
        title: t('routes.dashboard.dashboard'),
      },
      children: [
        {
          path: 'analysis',
          name: PermissionsEnum.AnalysisNav,
          component: () => import('@/views/dashboard/analysis/index.vue'),
          meta: {
            // affix: true,
            title: t('routes.dashboard.analysis'),
          },
        },
        {
          path: 'workbench',
          name: PermissionsEnum.WorkbenchNav,
          component: () => import('@/views/dashboard/workbench/index.vue'),
          meta: {
            title: t('routes.dashboard.workbench'),
          },
        },
      ],
    },
    {
      path: '/account',
      name: PermissionsEnum.PersonalDir,
      component: 'LAYOUT',
      redirect: '/account/index',
      meta: {
        icon: 'ant-design:audit-outlined',
        title: 'routes.admin.personal.moduleName',
        orderNo: 3,
        isTransformToRoute: true,
      },
      children: [
        {
          path: 'setting',
          name: PermissionsEnum.PersonalInfoNav,
          component: '/admin/account/setting/index',
          meta: {
            title: 'routes.admin.personal.info',
            icon: 'ant-design:idcard-twotone',
            isTransformToRoute: true,
          },
        },
      ],
    },
    {
      path: '/system',
      name: PermissionsEnum.SystmeDir,
      component: 'LAYOUT',
      redirect: '/system/user',
      meta: {
        icon: 'ion:settings-outline',
        title: 'routes.admin.system.moduleName',
        orderNo: 2,
        uniqId: PermissionsEnum.SystmeDir,
        isTransformToRoute: true,
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
            isTransformToRoute: true,
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
            isTransformToRoute: true,
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
            uniqueId: PermissionsEnum.ConfigNav,
            isTransformToRoute: true,
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
            isTransformToRoute: true,
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
            isTransformToRoute: true,
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
            isTransformToRoute: true,
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
            isTransformToRoute: true,
          },
        },
      ],
    },
  ] as AppRouteModule[];

  // 从接口获取菜单
  // return AdminApi.get<getMenuListResultModel>(
  //   { url: Api.GetMenuList },
  //   {
  //     retryRequest: {
  //       isOpenRetry: true,
  //       count: 5,
  //       waitTime: 30000,
  //     },
  //     errorMessageMode: 'message', // 错误直接提示后台返回信息
  //   },
  // );
};
