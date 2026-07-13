(function (factory) {
  if (typeof define === 'function' && define.amd)
    define(['exports', './kotlinx-serialization-kotlinx-serialization-core.js', './kotlin-kotlin-stdlib.js'], factory);
  else if (typeof exports === 'object')
    factory(module.exports, require('./kotlinx-serialization-kotlinx-serialization-core.js'), require('./kotlin-kotlin-stdlib.js'));
  else {
    if (typeof globalThis['kotlinx-serialization-kotlinx-serialization-core'] === 'undefined') {
      throw new Error("Error loading module 'game-coachApi'. Its dependency 'kotlinx-serialization-kotlinx-serialization-core' was not found. Please, check whether 'kotlinx-serialization-kotlinx-serialization-core' is loaded prior to 'game-coachApi'.");
    }
    if (typeof globalThis['kotlin-kotlin-stdlib'] === 'undefined') {
      throw new Error("Error loading module 'game-coachApi'. Its dependency 'kotlin-kotlin-stdlib' was not found. Please, check whether 'kotlin-kotlin-stdlib' is loaded prior to 'game-coachApi'.");
    }
    globalThis['game-coachApi'] = factory(typeof globalThis['game-coachApi'] === 'undefined' ? {} : globalThis['game-coachApi'], globalThis['kotlinx-serialization-kotlinx-serialization-core'], globalThis['kotlin-kotlin-stdlib']);
  }
}(function (_, kotlin_org_jetbrains_kotlinx_kotlinx_serialization_core, kotlin_kotlin) {
  'use strict';
  //region block: imports
  var imul = Math.imul;
  var ArrayListSerializer = kotlin_org_jetbrains_kotlinx_kotlinx_serialization_core.$_$.b;
  var LazyThreadSafetyMode_PUBLICATION_getInstance = kotlin_kotlin.$_$.c;
  var lazy = kotlin_kotlin.$_$.j1;
  var protoOf = kotlin_kotlin.$_$.b1;
  var initMetadataForCompanion = kotlin_kotlin.$_$.y;
  var toString = kotlin_kotlin.$_$.c1;
  var getStringHashCode = kotlin_kotlin.$_$.v;
  var hashCode = kotlin_kotlin.$_$.w;
  var equals = kotlin_kotlin.$_$.r;
  var initMetadataForClass = kotlin_kotlin.$_$.x;
  var PluginGeneratedSerialDescriptor = kotlin_org_jetbrains_kotlinx_kotlinx_serialization_core.$_$.e;
  var StringSerializer_getInstance = kotlin_org_jetbrains_kotlinx_kotlinx_serialization_core.$_$.a;
  var typeParametersSerializers = kotlin_org_jetbrains_kotlinx_kotlinx_serialization_core.$_$.c;
  var GeneratedSerializer = kotlin_org_jetbrains_kotlinx_kotlinx_serialization_core.$_$.d;
  var initMetadataForObject = kotlin_kotlin.$_$.a1;
  var VOID = kotlin_kotlin.$_$.a;
  //endregion
  //region block: pre-declaration
  initMetadataForCompanion(Companion);
  initMetadataForClass(OpeningExplainResponse, 'OpeningExplainResponse');
  initMetadataForObject($serializer, '$serializer', VOID, VOID, [GeneratedSerializer]);
  //endregion
  function OpeningExplainResponse$Companion$$childSerializers$_anonymous__p4hhze() {
    return new ArrayListSerializer($serializer_getInstance());
  }
  function Companion() {
    Companion_instance = this;
    var tmp = this;
    var tmp_0 = LazyThreadSafetyMode_PUBLICATION_getInstance();
    // Inline function 'kotlin.arrayOf' call
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    tmp.q7_1 = [null, lazy(tmp_0, OpeningExplainResponse$Companion$$childSerializers$_anonymous__p4hhze), null];
  }
  var Companion_instance;
  function Companion_getInstance() {
    if (Companion_instance == null)
      new Companion();
    return Companion_instance;
  }
  function OpeningExplainResponse(text, passages, composerId) {
    Companion_getInstance();
    this.r7_1 = text;
    this.s7_1 = passages;
    this.t7_1 = composerId;
  }
  protoOf(OpeningExplainResponse).toString = function () {
    return 'OpeningExplainResponse(text=' + this.r7_1 + ', passages=' + toString(this.s7_1) + ', composerId=' + this.t7_1 + ')';
  };
  protoOf(OpeningExplainResponse).hashCode = function () {
    var result = getStringHashCode(this.r7_1);
    result = imul(result, 31) + hashCode(this.s7_1) | 0;
    result = imul(result, 31) + getStringHashCode(this.t7_1) | 0;
    return result;
  };
  protoOf(OpeningExplainResponse).equals = function (other) {
    if (this === other)
      return true;
    if (!(other instanceof OpeningExplainResponse))
      return false;
    if (!(this.r7_1 === other.r7_1))
      return false;
    if (!equals(this.s7_1, other.s7_1))
      return false;
    if (!(this.t7_1 === other.t7_1))
      return false;
    return true;
  };
  function $serializer() {
    $serializer_instance = this;
    var tmp0_serialDesc = new PluginGeneratedSerialDescriptor('com.example.coachapi.Passage', this, 3);
    tmp0_serialDesc.m7('sourceId', false);
    tmp0_serialDesc.m7('title', false);
    tmp0_serialDesc.m7('text', false);
    this.u7_1 = tmp0_serialDesc;
  }
  protoOf($serializer).u6 = function () {
    return this.u7_1;
  };
  protoOf($serializer).i7 = function () {
    // Inline function 'kotlin.arrayOf' call
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    return [StringSerializer_getInstance(), StringSerializer_getInstance(), StringSerializer_getInstance()];
  };
  var $serializer_instance;
  function $serializer_getInstance() {
    if ($serializer_instance == null)
      new $serializer();
    return $serializer_instance;
  }
  //region block: post-declaration
  protoOf($serializer).j7 = typeParametersSerializers;
  //endregion
  //region block: exports
  _.$_$ = _.$_$ || {};
  _.$_$.a = OpeningExplainResponse;
  //endregion
  return _;
}));

//# sourceMappingURL=game-coachApi.js.map
