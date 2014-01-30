Package.describe({
  summary: "Use Bower packages in your Meteor app"
});

Package._transitional_registerBuildPlugin({
  name: "bower",
  use: [
    "underscore",
  ],
  sources: [
    "plugin/bower.js",
  ],
  npmDependencies: {
    "bower": "1.2.8",
  }
});
