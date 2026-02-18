const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(
        {
            ...env,
            babel: {
                dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons'],
            },
        },
        argv
    );

    // Alias react-native-maps to an empty module on web
    config.resolve.alias = {
        ...config.resolve.alias,
        'react-native-maps': false,
    };

    return config;
};
