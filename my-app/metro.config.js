const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-filament loads chess.glb + papermill KTX2 via Metro's asset
// pipeline — register those extensions so `require('./x.glb')` resolves.
config.resolver.assetExts.push('glb', 'ktx', 'ktx2', 'hdr');

module.exports = config;
