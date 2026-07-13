(function (factory) {
  if (typeof define === 'function' && define.amd)
    define(['exports', './kotlin-kotlin-stdlib.js'], factory);
  else if (typeof exports === 'object')
    factory(module.exports, require('./kotlin-kotlin-stdlib.js'));
  else {
    if (typeof globalThis['kotlin-kotlin-stdlib'] === 'undefined') {
      throw new Error("Error loading module 'game-onDeviceAi'. Its dependency 'kotlin-kotlin-stdlib' was not found. Please, check whether 'kotlin-kotlin-stdlib' is loaded prior to 'game-onDeviceAi'.");
    }
    globalThis['game-onDeviceAi'] = factory(typeof globalThis['game-onDeviceAi'] === 'undefined' ? {} : globalThis['game-onDeviceAi'], globalThis['kotlin-kotlin-stdlib']);
  }
}(function (_, kotlin_kotlin) {
  'use strict';
  //region block: imports
  var imul = Math.imul;
  var protoOf = kotlin_kotlin.$_$.b1;
  var getBooleanHashCode = kotlin_kotlin.$_$.s;
  var initMetadataForClass = kotlin_kotlin.$_$.x;
  var Long = kotlin_kotlin.$_$.h1;
  var initMetadataForObject = kotlin_kotlin.$_$.a1;
  var Unit_instance = kotlin_kotlin.$_$.b;
  var Enum = kotlin_kotlin.$_$.g1;
  var VOID = kotlin_kotlin.$_$.a;
  var equalsLong = kotlin_kotlin.$_$.p;
  var getNumberHashCode = kotlin_kotlin.$_$.t;
  var equals = kotlin_kotlin.$_$.r;
  //endregion
  //region block: pre-declaration
  initMetadataForClass(AiRoutePolicy, 'AiRoutePolicy');
  initMetadataForObject(AiRoutePolicies, 'AiRoutePolicies');
  initMetadataForClass(PrivacyClass, 'PrivacyClass', VOID, Enum);
  initMetadataForClass(LatencyBudget, 'LatencyBudget');
  initMetadataForClass(CostBudget, 'CostBudget');
  //endregion
  function AiRoutePolicy(privacyClass, latencyBudget, costBudget, allowCloud, requireOffline) {
    this.w5_1 = privacyClass;
    this.x5_1 = latencyBudget;
    this.y5_1 = costBudget;
    this.z5_1 = allowCloud;
    this.a6_1 = requireOffline;
  }
  protoOf(AiRoutePolicy).toString = function () {
    return 'AiRoutePolicy(privacyClass=' + this.w5_1.toString() + ', latencyBudget=' + this.x5_1.toString() + ', costBudget=' + this.y5_1.toString() + ', allowCloud=' + this.z5_1 + ', requireOffline=' + this.a6_1 + ')';
  };
  protoOf(AiRoutePolicy).hashCode = function () {
    var result = this.w5_1.hashCode();
    result = imul(result, 31) + this.x5_1.hashCode() | 0;
    result = imul(result, 31) + this.y5_1.hashCode() | 0;
    result = imul(result, 31) + getBooleanHashCode(this.z5_1) | 0;
    result = imul(result, 31) + getBooleanHashCode(this.a6_1) | 0;
    return result;
  };
  protoOf(AiRoutePolicy).equals = function (other) {
    if (this === other)
      return true;
    if (!(other instanceof AiRoutePolicy))
      return false;
    if (!this.w5_1.equals(other.w5_1))
      return false;
    if (!this.x5_1.equals(other.x5_1))
      return false;
    if (!this.y5_1.equals(other.y5_1))
      return false;
    if (!(this.z5_1 === other.z5_1))
      return false;
    if (!(this.a6_1 === other.a6_1))
      return false;
    return true;
  };
  function AiRoutePolicies() {
    AiRoutePolicies_instance = this;
    this.b6_1 = new AiRoutePolicy(PrivacyClass_LOCAL_ONLY_getInstance(), new LatencyBudget(new Long(5000, 0), new Long(20000, 0)), new CostBudget(0.0), false, true);
    this.c6_1 = new AiRoutePolicy(PrivacyClass_PUBLIC_OR_SYNTHETIC_getInstance(), new LatencyBudget(new Long(2500, 0), new Long(8000, 0)), new CostBudget(0.2), true, false);
    this.d6_1 = new AiRoutePolicy(PrivacyClass_LOCAL_ONLY_getInstance(), new LatencyBudget(new Long(5000, 0), new Long(20000, 0)), new CostBudget(0.0), false, true);
  }
  var AiRoutePolicies_instance;
  function AiRoutePolicies_getInstance() {
    if (AiRoutePolicies_instance == null)
      new AiRoutePolicies();
    return AiRoutePolicies_instance;
  }
  var PrivacyClass_LOCAL_ONLY_instance;
  var PrivacyClass_USER_PRIVATE_instance;
  var PrivacyClass_PUBLIC_OR_SYNTHETIC_instance;
  var PrivacyClass_entriesInitialized;
  function PrivacyClass_initEntries() {
    if (PrivacyClass_entriesInitialized)
      return Unit_instance;
    PrivacyClass_entriesInitialized = true;
    PrivacyClass_LOCAL_ONLY_instance = new PrivacyClass('LOCAL_ONLY', 0);
    PrivacyClass_USER_PRIVATE_instance = new PrivacyClass('USER_PRIVATE', 1);
    PrivacyClass_PUBLIC_OR_SYNTHETIC_instance = new PrivacyClass('PUBLIC_OR_SYNTHETIC', 2);
  }
  function PrivacyClass(name, ordinal) {
    Enum.call(this, name, ordinal);
  }
  function LatencyBudget(firstTokenMs, completeMs) {
    this.e6_1 = firstTokenMs;
    this.f6_1 = completeMs;
  }
  protoOf(LatencyBudget).toString = function () {
    return 'LatencyBudget(firstTokenMs=' + this.e6_1.toString() + ', completeMs=' + this.f6_1.toString() + ')';
  };
  protoOf(LatencyBudget).hashCode = function () {
    var result = this.e6_1.hashCode();
    result = imul(result, 31) + this.f6_1.hashCode() | 0;
    return result;
  };
  protoOf(LatencyBudget).equals = function (other) {
    if (this === other)
      return true;
    if (!(other instanceof LatencyBudget))
      return false;
    if (!equalsLong(this.e6_1, other.e6_1))
      return false;
    if (!equalsLong(this.f6_1, other.f6_1))
      return false;
    return true;
  };
  function CostBudget(maxUsdCents) {
    this.g6_1 = maxUsdCents;
  }
  protoOf(CostBudget).toString = function () {
    return 'CostBudget(maxUsdCents=' + this.g6_1 + ')';
  };
  protoOf(CostBudget).hashCode = function () {
    return getNumberHashCode(this.g6_1);
  };
  protoOf(CostBudget).equals = function (other) {
    if (this === other)
      return true;
    if (!(other instanceof CostBudget))
      return false;
    if (!equals(this.g6_1, other.g6_1))
      return false;
    return true;
  };
  function PrivacyClass_LOCAL_ONLY_getInstance() {
    PrivacyClass_initEntries();
    return PrivacyClass_LOCAL_ONLY_instance;
  }
  function PrivacyClass_PUBLIC_OR_SYNTHETIC_getInstance() {
    PrivacyClass_initEntries();
    return PrivacyClass_PUBLIC_OR_SYNTHETIC_instance;
  }
  //region block: exports
  _.$_$ = _.$_$ || {};
  _.$_$.a = AiRoutePolicies_getInstance;
  //endregion
  return _;
}));

//# sourceMappingURL=game-onDeviceAi.js.map
