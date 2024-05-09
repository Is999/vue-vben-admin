export function trimParam(params: Recordable) {
  if ('[object Object]' !== Object.prototype.toString.call(params)) {
    return;
  }
  // 过滤空字符串,空数组,空对象
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === '') {
      delete params[key];
      return;
    }
    const type = Object.prototype.toString.call(value);
    if ('[object String]' === type) {
      if ('' === value.trim()) {
        delete params[key];
      } else {
        params[key] = value.trim();
      }
    } else if ('[object Array]' === type) {
      if (0 === value.length) {
        delete params[key];
      }
    } else if ('[object Object]' === type) {
      if (0 === Object.keys(value).length) {
        delete params[key];
      }
    }
  });
  return params;
}
