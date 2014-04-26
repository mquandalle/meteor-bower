Package.describe({
  summary: "Use Bower packages in your Meteor app",
  version: "0.1.7"
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
    "bower": "1.3.3",
  }
});

// XXX Tests?
