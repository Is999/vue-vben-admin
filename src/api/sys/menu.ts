// import { AdminApi } from '@/api/api';
// import { getMenuListResultModel } from './model/menuModel';

import { menuList } from '@/router/menus/menus';
// import system from "@/router/routes/modules/admin/system";

// enum Api {
//   GetMenuList = '/menu/nav',
// }

/**
 * @description: Get user menu based on id
 */

export const getMenuList = () => {
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

  return menuList;
};
