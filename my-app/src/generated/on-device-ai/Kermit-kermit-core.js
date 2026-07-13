(function (factory) {
  if (typeof define === 'function' && define.amd)
    define(['exports'], factory);
  else if (typeof exports === 'object')
    factory(module.exports);
  else
    globalThis['Kermit-kermit-core'] = factory(typeof globalThis['Kermit-kermit-core'] === 'undefined' ? {} : globalThis['Kermit-kermit-core']);
}(function (_) {
  'use strict';
  //region block: pre-declaration
  //endregion
  return _;
}));

//# sourceMappingURL=Kermit-kermit-core.js.map
