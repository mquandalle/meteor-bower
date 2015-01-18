Package.describe({
  summary: "Use Bower packages in your Meteor app",
  name: "mquandalle:bower",
  git: "https://github.com/mquandalle/meteor-bower.git",
  version: "0.1.12"
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
    "bower": "1.3.12",
    "glob": "3.2.9"
  }
});

// XXX Tests?
