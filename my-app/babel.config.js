module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-filament depends on react-native-worklets-core for driving
      // transforms off the JS thread; its babel plugin is required.
      ['react-native-worklets-core/plugin'],
    ],
  };
};
