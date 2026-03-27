const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const encodeBase62 = (num) => {
  let n = BigInt(num);
  let result = '';
  while (n > 0n) {
    result = BASE62[Number(n % 62n)] + result;
    n = n / 62n;
  }
  return result; // always 10-11 chars for a Snowflake ID
};


