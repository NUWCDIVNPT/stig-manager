module.exports = function klona(val) {
  // MIT License
  // Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
  // https://github.com/lukeed/klona

  let k, out, tmp

  if (Array.isArray(val)) {
    out = Array(k = val.length)
    while (k--) out[k] = (tmp = val[k]) && typeof tmp === 'object' ? klona(tmp) : tmp
    return out
  }

  if (Object.prototype.toString.call(val) === '[object Object]') {
    out = {} // null
    for (k in val) {
      if (k === '__proto__') {
        Object.defineProperty(out, k, {
          value: klona(val[k]),
          configurable: true,
          enumerable: true,
          writable: true,
        })
      } else {
        out[k] = (tmp = val[k]) && typeof tmp === 'object' ? klona(tmp) : tmp
      }
    }
    return out
  }

  return val
}