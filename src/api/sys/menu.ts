import { AdminApi } from '/@/api/api';
import { getMenuListResultModel } from './model/menuModel';

enum Api {
  GetMenuList = '/menu/nav',
}

/**
 * @description: Get user menu based on id
 */

export const getMenuList = () => {
  return AdminApi.get<getMenuListResultModel>(
    { url: Api.GetMenuList },
    {
      retryRequest: {
        isOpenRetry: true,
        count: 5,
        waitTime: 30000,
      },
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};
