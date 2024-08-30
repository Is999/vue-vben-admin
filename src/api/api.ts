import Http, { defHttp } from '@/utils/http/axios';
// import { useGlobSetting } from '/@/hooks/setting/index';
import { captchaApiResultModel } from '@/api/sys/model/captcha';
import type { Result } from '#/axios';
import { useMessage } from '@/hooks/web/useMessage';
import { ResultEnum } from '@/enums/httpEnum';
import { useMfaStore } from '@/store/modules/mfa';

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
    urlPrefix: '/admin/api',
    statusCodes: [406],
  },
  authenticationScheme: 'Bearer',
});

export function notify(res: Result, errer = false) {
  // 返回特定状态码打开验证MFA设备遮罩层
  if (res.code === ResultEnum.CHECK_MFA_CODE_EXPIRED) {
    const mfaInfo = useMfaStore().getMfaInfo;
    mfaInfo.isTwoStepVerification = true; // 打开身份验证页面
    mfaInfo.twoStepTime = 0; // 重置时间
    useMfaStore().setMfaInfo(mfaInfo);
  }

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
