import Http, { defHttp } from '/@/utils/http/axios';
// import { useGlobSetting } from '/@/hooks/setting/index';
import { captchaApiResultModel } from '/@/api/sys/model/captcha';
import type { Result } from '/#/axios';
import { useMessage } from '/@/hooks/web/useMessage';

// const globSetting = useGlobSetting();

// 验证码
export function captchaApi() {
  return defHttp.get<captchaApiResultModel>(
    {
      url: '/captcha/api/default',
    },
    { isTransformResponse: false },
  );
}

// 实例化http
export const AdminApi = Http({
  timeout: 30 * 1000,
  requestOptions: {
    apiUrl: '/admin-api/',
    urlPrefix: '',
    statusCodes: [406],
  },
  authenticationScheme: 'Bearer',
});

export function notify(res: Result, errer = false) {
  const { createMessage } = useMessage();
  if (res.success) {
    createMessage.success(res.message);
    return;
  }
  const message = '【' + res.code + '】' + res.message;
  createMessage.error(message);
  if (errer) {
    throw new Error(message);
  }
}
