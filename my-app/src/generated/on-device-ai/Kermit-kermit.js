(function (factory) {
  if (typeof define === 'function' && define.amd)
    define(['exports'], factory);
  else if (typeof exports === 'object')
    factory(module.exports);
  else
    globalThis['Kermit-kermit'] = factory(typeof globalThis['Kermit-kermit'] === 'undefined' ? {} : globalThis['Kermit-kermit']);
}(function (_) {
  'use strict';
  //region block: pre-declaration
  //endregion
  var defaultTag;
  //region block: init
  defaultTag = '';
  //endregion
  return _;
}));

//# sourceMappingURL=Kermit-kermit.js.map
