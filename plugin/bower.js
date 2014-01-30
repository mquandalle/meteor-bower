var bower = Npm.require("bower");
var Future = Npm.require('fibers/future');

// XXX Hack. If this line is not present the `bower.json` handler is not called
Plugin.registerSourceHandler("json", null);

Plugin.registerSourceHandler("smart.json", function (compileStep) {
  // XXX Code copied from
  // packages/templating/plugin/compile-template.js:6
  if (! compileStep.arch.match(/^browser(\.|$)/))
    return;

  var content = compileStep.read().toString('utf8');
  try {
    var tree = JSON.parse(content);
  } catch (e) {
    compileStep.error({
      message: "Syntax error in " + compileStep.inputPath,
      line: e.line,
      column: e.column
    });
  }

  if (_.has(tree, "bower")) {
    if (! _.isArray(tree.bower))
      compileStep.error({
        message: "Bower attribute must be an array in " + compileStep.inputPath
      });

    // XXX We should test if we already have the dependency in local cache
    // XXX Where should we store bower packages? Maybe we could reuse meteor
    // internal star.json but I don't think we have the needed API
    // XXX Use Future to wait until the dependencies are downloaded
    bower.commands
    .install(tree.bower, { save: true })
    .on('end', function (installed) {
      console.log("bonjour");
    });
  }
});
