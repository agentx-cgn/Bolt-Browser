responseData: function (e, t) {
  if (void 0 == e || null == e || !t) return null;
  var r = 0, i = n.getInt16Bytes(e, t, r), a = n.byteArrayToInt16(i.reverse());
  return r += i.length, { voltage: a /= 100 }
}

getInt16Bytes = function (e, t, r) {
  return p(e, t, r, 2)
}
byteArrayToInt16 = function (e) {
  return l(e)
}

p = function (e, t, r, n) {
  if (! e)
    return [];

  var i = r + n;
  return i > t ? [] : e.slice(r, i)
}

l = function (e) {
  var t = 0;
  if (! e)
    return t;


  for (var r = e.length - 1; r >= 0; r--)
    t = 256 * t + e[r];


  return t
},
