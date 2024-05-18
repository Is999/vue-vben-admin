import type { AppRouteModule } from '@/router/types';

import { PermissionsEnum } from '@/enums/permissionsEnum';

const account: AppRouteModule = {
  path: '/account',
  name: PermissionsEnum.PersonalDir,
  component: 'LAYOUT',
  redirect: '/account/index',
  meta: {
    icon: 'ant-design:audit-outlined',
    title: 'routes.admin.personal.moduleName',
    orderNo: 3,
  },
  children: [
    {
      path: 'setting',
      name: PermissionsEnum.PersonalInfoNav,
      component: '/admin/account/setting/index',
      meta: {
        title: 'routes.admin.personal.info',
        icon: 'ant-design:idcard-twotone',
      },
    },
  ],
};

export default account;
