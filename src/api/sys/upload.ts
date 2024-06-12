import Http from '@/utils/http/axios';
import { Result, UploadFileParams } from '#/axios';
import { useGlobSetting } from '@/hooks/setting';
import { AxiosProgressEvent } from 'axios';

const { uploadUrl = '/upload' } = useGlobSetting();

// 实例化http
export const UploadApi = Http({
  timeout: 30 * 1000,
  requestOptions: {
    apiUrl: uploadUrl,
    urlPrefix: '',
    // statusCodes: [],
  },
  authenticationScheme: 'Bearer',
});

/**
 * @description: Upload interface
 */
export function uploadApi(
  params: UploadFileParams,
  onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
) {
  const result = UploadApi.uploadFile<Result>(
    {
      url: uploadUrl + '/image',
      onUploadProgress,
    },
    params,
  );

  return Promise.resolve(
    result.then((res) => {
      return res.data.data;
    }),
  );
}
