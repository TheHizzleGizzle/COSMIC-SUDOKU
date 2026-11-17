// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Keep Metro lean inside the preview container.
config.maxWorkers = 2;

module.exports = config;
