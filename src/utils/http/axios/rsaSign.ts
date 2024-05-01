export function signStr(
  data: Record<string, any>,
  signParams: string[],
  requestId: string,
  appId: string,
): any {
  // 参数key按ASCII编码顺序排序
  signParams.sort();

  let str = '';
  for (const key of signParams) {
    if (undefined === data[key]) {
      new Error('缺少参数: ' + key);
    }
    if ('' === data[key] || data[key] === null) {
      continue;
    }
    str += key + '=' + data[key] + '&';
  }

  return str + 'requestId=' + requestId + '&key=' + appId;
}
