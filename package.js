Package.describe({
  summary: "Use Bower packages in your Meteor app",
  name: "mquandalle:bower",
  git: "https://github.com/mquandalle/meteor-bower.git",
  // This matches the upstream version. If you want to publish a new version of
  // the package without pulling a new upstream version, you should call it
  // '1.4.1_4'
  version: "1.4.1_3"
});

Package.registerBuildPlugin({
  name: "bower",
  use: [
    "meteor",
    "underscore@1.0.0"
  ],
  sources: [
    "plugin/bower.js",
    "plugin/handler.js"
  ],
  npmDependencies: {
    "bower": "1.4.1",
    "glob": "3.2.9"
  }
});

// XXX Tests?
