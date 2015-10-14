Package.describe({
  summary: "Use Bower packages in your Meteor app",
  name: "mquandalle:bower",
  git: "https://github.com/mquandalle/meteor-bower.git",
  // This matches the upstream version. If you want to publish a new version of
  // the package without pulling a new upstream version, you should increment
  // the underscored number: '1.5.2' -> '1.5.2_1' -> '1.5.2_2'
  version: "1.5.2_1"
});

Package.registerBuildPlugin({
  name: "bower",
  use: [
    "meteor",
    "underscore@1.0.4"
  ],
  sources: [
    "plugin/bower.js",
    "plugin/handler.js"
  ],
  npmDependencies: {
    "bower": "1.5.2",
    "glob": "5.0.14"
  }
});
