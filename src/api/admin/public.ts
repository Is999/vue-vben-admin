import {AdminApi} from '/@/api/api';
import { SelectLists } from '/@/api/admin/model/public';
import { isString } from '/@/utils/is';

enum Api {
  PlatformsSelectList = '/platforms/selectList', // 平台下拉框
  ChannelsSelectList = '/channels/selectList', // 平台下拉框
  ChannelsGatewaySelectList = '/channels/gatewaySelectList', // 渠道下拉框
}

// 平台下拉框
export const getPlatformsSelectList = (isShown = false) => {
  let url: string = Api.PlatformsSelectList;
  if (isShown === true) {
    url = url + '/y';
  }
  return AdminApi.get<SelectLists[]>(
    { url: url },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 渠道下拉框
export const getChannelsSelectList = (platform = '') => {
  let url: string = Api.ChannelsSelectList;
  if (isString(platform) && platform != '') {
    url = url + '/' + platform;
  }
  return AdminApi.get<SelectLists[]>(
    { url: url },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};

// 网关下拉框
export const getGatewaySelectList = () => {
  return AdminApi.get<SelectLists[]>(
    { url: Api.ChannelsGatewaySelectList },
    {
      errorMessageMode: 'message', // 错误直接提示后台返回信息
    },
  );
};
