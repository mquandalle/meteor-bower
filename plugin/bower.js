var path = Npm.require("path");
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
    if (! _.isObject(tree.bower))
      compileStep.error({
        message: "Bower attribute must be an object in " + compileStep.inputPath
      });

    // Install bower_components into the same folder as 'smart.json' (which is
    //  the package's root folder).
    var packageRoot = path.dirname(compileStep._fullInputPath);
    var relativePath = path.relative(process.cwd(), packageRoot);
    var bowerDir = path.join(relativePath, "bower_components");

    // Convert 'smart.json' version spec object to an array format which
    //  is needed by 'bower.commands.install()'
    //  bower: {
    //    "foo": "1.2.3",
    //    "bar": "2.1.2"
    //  }
    //  =>
    //  ["foo#1.2.3", "foo#2.1.2"]
    var specs = _.map(tree.bower, function(version, name) {
      return name + "#" + version;
    });

    // XXX We should test if we already have the dependency in local cache
    // XXX Where should we store bower packages? Maybe we could reuse meteor
    // internal star.json but I don't think we have the needed API
    // XXX Use Future to wait until the dependencies are downloaded
    console.log("\n" + compileStep.packageName + ": updating bower dependencies...");
    var fut = new Future;

    bower.commands
    .install(specs, {save: true}, {directory: bowerDir})
    .on('end', function (installed) {
      if (!_.isEmpty(installed)) {
        console.log("installed bower packages:");
        var pkgs = {};
        _.each(installed, function(val, name) {
          pkgs[name] = val.pkgMeta.version;
        });
        console.log(pkgs);
      }
      fut["return"]({});
    });

    fut.wait();

  }
});
