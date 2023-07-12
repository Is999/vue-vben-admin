export function trimParam(param: any) {
  if ('[object Object]' !== Object.prototype.toString.call(param)) {
    return;
  }
  // 过滤空字符串,空数组,空对象
  Object.keys(param).forEach((key) => {
    const value = param[key];
    if (value === null || value === undefined || value === '') {
      delete param[key];
      return;
    }
    const type = Object.prototype.toString.call(value);
    if ('[object String]' === type) {
      if ('' === value.trim()) {
        delete param[key];
      } else {
        param[key] = value.trim();
      }
    } else if ('[object Array]' === type) {
      if (0 === value.length) {
        delete param[key];
      }
    } else if ('[object Object]' === type) {
      if (0 === Object.keys(value).length) {
        delete param[key];
      }
    }
  });
  return param;
}
