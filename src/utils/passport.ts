// 生成指定长度的密码
// 密码包含数字、小写字母、大写字母、特殊字符（不包含空格）ASII（33-126）
// 密码以字母开头
export function generate(length: number): string {
  const num = { min: 48, max: 57 }; // 数字
  const lowLetter = { min: 97, max: 122 }; // 小写字母
  const upLetters = { min: 65, max: 90 }; // 大写字母
  const specialChar = [
    { min: 33, max: 47 },
    { min: 58, max: 64 },
    { min: 91, max: 96 },
    { min: 123, max: 126 },
  ]; // 特殊字符

  let speCharCount = Math.floor(length / 5); // 特殊字符个数，每5个字符包含一个特殊字符

  let min = lowLetter.min;
  let max = lowLetter.max;
  let t = Random(0, 2); // 生成字符类型
  if (t == 1) {
    min = upLetters.min;
    max = upLetters.max;
  }
  const first = String.fromCharCode(Random(min, max)); // 首字符
  const strArr: string[] = [];

  for (let i = 1; i <= length - 1; i++) {
    if (i === 1) {
      // 第二个字符生成和首字符不同类型的字母
      if (t == 0) {
        min = upLetters.min;
        max = upLetters.max;
      } else {
        min = lowLetter.min;
        max = lowLetter.max;
      }
    } else if (i === 2) {
      // 第三个字符生成数字
      min = num.min;
      max = num.max;
    } else if (i === 3 || speCharCount > 0) {
      // 第四个字符生成特殊字符，优先完成特殊字符的生成
      t = Random(0, specialChar.length - 1);
      min = specialChar[t].min;
      max = specialChar[t].max;
      --speCharCount;
    } else {
      t = Random(0, 2);
      if (t === 2) {
        min = num.min;
        max = num.max;
      } else if (t === 1) {
        min = upLetters.min;
        max = upLetters.max;
      } else {
        min = lowLetter.min;
        max = lowLetter.max;
      }
    }
    strArr.push(String.fromCharCode(Random(min, max)));
  }
  return (
    first +
    strArr
      .sort(() => Math.random() - 0.5)
      .toString()
      .replace(/,/g, '')
  );
}

function Random(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}

// 验证密码是否由数字、小写字母、大写字母、特殊字符（不包含空格）组成 ASII（33-126）
export function checkChars(value: string): boolean {
  for (let i = 0; i < value.length; ++i) {
    const char = value.charCodeAt(i);
    console.log(i, '字符', value[i], char);
    if (char < 33 || char > 126) {
      return false;
    }
  }
  return true;
}

// 验证密码是否包含特殊字符
export function containSpecialChars(value: string): boolean {
  const specialChar = [
    { min: 33, max: 47 },
    { min: 58, max: 64 },
    { min: 91, max: 96 },
    { min: 123, max: 126 },
  ]; // 特殊字符

  for (let i = 0; i < value.length; ++i) {
    const char = value.charCodeAt(i);
    console.log(i, '字符', value[i], char);
    for (const specChar of specialChar) {
      if (specChar.max >= char && char >= specChar.min) {
        return true;
      }
    }
  }
  return false;
}
