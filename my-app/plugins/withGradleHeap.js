// Raises the Gradle daemon heap in the generated android/gradle.properties.
//
// AGP's APK packager reads each native library fully into memory before
// compressing it (zipflinger BytesSource). With the two ~80 MB Stockfish
// binaries from modules/stockfish, the template's 2 GB heap ran out in
// :app:packageDebug about a third of the time (OutOfMemoryError: Java heap space).
const { withGradleProperties } = require('expo/config-plugins');

const DEFAULT_JVM_ARGS = '-Xmx4g -XX:MaxMetaspaceSize=1g';

module.exports = function withGradleHeap(config, { jvmArgs = DEFAULT_JVM_ARGS } = {}) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const existing = props.find((item) => item.type === 'property' && item.key === 'org.gradle.jvmargs');
    if (existing) {
      existing.value = jvmArgs;
    } else {
      props.push({ type: 'property', key: 'org.gradle.jvmargs', value: jvmArgs });
    }
    return config;
  });
};
