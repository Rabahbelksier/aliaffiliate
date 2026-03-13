const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /\.local[\/\\]/,
  /\.git[\/\\]/,
];

const semverShims = {
  "semver/functions/satisfies": path.resolve(__dirname, "mocks/semver-functions/satisfies.js"),
  "semver/functions/prerelease": path.resolve(__dirname, "mocks/semver-functions/prerelease.js"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (semverShims[moduleName]) {
    return { filePath: semverShims[moduleName], type: "sourceFile" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
