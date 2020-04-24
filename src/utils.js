function numberToLetter(num) {
  let ret = '';
  for (let a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) { // eslint-disable-line
    ret = String.fromCharCode(parseInt((num % b) / a, 10) + 65) + ret;
  }
  return ret;
}

function detectValues(val) {
  if (val === '') return null;
  if (val === 'TRUE') return true;
  if (val === 'FALSE') return false;
  if (/^\d+\.\d+$/.test(val)) return parseFloat(val);
  if (/^\d+$/.test(val)) return parseInt(val, 10);
  return val;
}

function throwError(message, errorCode, state) {
  const err = new Error(message);
  err.status = errorCode;
  if (state) {
    err.state = state;
  }
  throw err;
}

function getParams(input, possibleParams) {
  const output = {};
  possibleParams.forEach((k) => {
    if (input[k] !== null && input[k] !== undefined) output[k] = input[k];
  });
  return output;
}

module.exports = {
  detectValues,
  numberToLetter,
  throwError,
  getParams,
};
