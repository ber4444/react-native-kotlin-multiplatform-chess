(function (factory) {
  if (typeof define === 'function' && define.amd)
    define(['exports'], factory);
  else if (typeof exports === 'object')
    factory(module.exports);
  else
    globalThis['kotlinx-atomicfu'] = factory(typeof globalThis['kotlinx-atomicfu'] === 'undefined' ? {} : globalThis['kotlinx-atomicfu']);
}(function (_) {
  'use strict';
  //region block: pre-declaration
  //endregion
  return _;
}));

//# sourceMappingURL=kotlinx-atomicfu.js.map
