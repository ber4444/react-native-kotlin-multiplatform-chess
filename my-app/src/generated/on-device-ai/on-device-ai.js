(function (factory) {
  if (typeof define === 'function' && define.amd)
    define(['exports', './kotlin-kotlin-stdlib.js', './game-onDeviceAi.js', './game-coachApi.js'], factory);
  else if (typeof exports === 'object')
    factory(module.exports, require('./kotlin-kotlin-stdlib.js'), require('./game-onDeviceAi.js'), require('./game-coachApi.js'));
  else {
    if (typeof globalThis['kotlin-kotlin-stdlib'] === 'undefined') {
      throw new Error("Error loading module 'on-device-ai'. Its dependency 'kotlin-kotlin-stdlib' was not found. Please, check whether 'kotlin-kotlin-stdlib' is loaded prior to 'on-device-ai'.");
    }
    if (typeof globalThis['game-onDeviceAi'] === 'undefined') {
      throw new Error("Error loading module 'on-device-ai'. Its dependency 'game-onDeviceAi' was not found. Please, check whether 'game-onDeviceAi' is loaded prior to 'on-device-ai'.");
    }
    if (typeof globalThis['game-coachApi'] === 'undefined') {
      throw new Error("Error loading module 'on-device-ai'. Its dependency 'game-coachApi' was not found. Please, check whether 'game-coachApi' is loaded prior to 'on-device-ai'.");
    }
    globalThis['on-device-ai'] = factory(typeof globalThis['on-device-ai'] === 'undefined' ? {} : globalThis['on-device-ai'], globalThis['kotlin-kotlin-stdlib'], globalThis['game-onDeviceAi'], globalThis['game-coachApi']);
  }
}(function (_, kotlin_kotlin, kotlin_io_github_ber4444_onDeviceAi, kotlin_io_github_ber4444_coachApi) {
  'use strict';
  //region block: imports
  var protoOf = kotlin_kotlin.$_$.b1;
  var initMetadataForClass = kotlin_kotlin.$_$.x;
  var AiRoutePolicies_getInstance = kotlin_io_github_ber4444_onDeviceAi.$_$.a;
  var emptyList = kotlin_kotlin.$_$.l;
  var OpeningExplainResponse = kotlin_io_github_ber4444_coachApi.$_$.a;
  var initMetadataForObject = kotlin_kotlin.$_$.a1;
  //endregion
  //region block: pre-declaration
  initMetadataForClass(OnDeviceAiSession, 'OnDeviceAiSession', OnDeviceAiSession);
  initMetadataForObject(SmokeReferences, 'SmokeReferences');
  //endregion
  function _forceTsDefinitions() {
  }
  function OnDeviceAiSession() {
  }
  protoOf(OnDeviceAiSession).getRoutePolicyName = function () {
    return SmokeReferences_getInstance().v7_1.toString();
  };
  protoOf(OnDeviceAiSession).getEmptyResponseComposerId = function () {
    return SmokeReferences_getInstance().w7().t7_1;
  };
  function SmokeReferences() {
    SmokeReferences_instance = this;
    this.v7_1 = AiRoutePolicies_getInstance().b6_1;
  }
  protoOf(SmokeReferences).w7 = function () {
    return new OpeningExplainResponse('', emptyList(), 'smoke');
  };
  var SmokeReferences_instance;
  function SmokeReferences_getInstance() {
    if (SmokeReferences_instance == null)
      new SmokeReferences();
    return SmokeReferences_instance;
  }
  //region block: exports
  function $jsExportAll$(_) {
    var com = _.com || (_.com = {});
    var example = com.example || (com.example = {});
    var ondeviceai = example.ondeviceai || (example.ondeviceai = {});
    ondeviceai._forceTsDefinitions = _forceTsDefinitions;
    ondeviceai.OnDeviceAiSession = OnDeviceAiSession;
  }
  $jsExportAll$(_);
  //endregion
  return _;
}));

//# sourceMappingURL=on-device-ai.js.map
