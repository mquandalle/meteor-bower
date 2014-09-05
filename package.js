Package.describe({
  summary: "Use Bower packages in your Meteor app",
  name: "mquandalle:bower",
  git: "https://github.com/mquandalle/meteor-bower.git",
  version: "0.1.11"
});

Package._transitional_registerBuildPlugin({
  name: "bower",
  use: [
    "meteor",
    "underscore",
  ],
  sources: [
    "plugin/bower.js",
    "plugin/handler.js",
  ],
  npmDependencies: {
    "bower": "1.3.8",
    "glob": "3.2.9"
  }
});

// XXX Tests?
