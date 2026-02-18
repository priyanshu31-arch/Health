const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure Metro to properly handle platform extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'tsx', 'ts', 'jsx', 'js'];

// Blacklist react-native-maps on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === 'react-native-maps') {
        // Return a mock module for web
        return {
            type: 'empty',
        };
    }

    // Use default resolver for everything else
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
