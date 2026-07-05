module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo includes the expo-router transform for SDK 50+.
    presets: ["babel-preset-expo"],
  };
};
