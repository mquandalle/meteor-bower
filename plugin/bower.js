var path = Npm.require("path");
var bower = Npm.require("bower");

// XXX Should find a better host
var rootBowerDirectory = ".meteor/local/bower_components";

// XXX Hack. If this line is not present the `smart.json` handler is not called
Plugin.registerSourceHandler("json", null);

// XXX smart.json will disappear when atmosphere will be merged in core. Should
// support "bower.json" that will contains only the bower packages dictionnary.
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

  if (! _.has(tree, "bower"))
    return;

  if (! _.isObject(tree.bower))
    compileStep.error({
      message: "Bower attribute must be an object in " + compileStep.inputPath
    });

  // XXX Where should we store bower packages? Maybe we could reuse meteor
  // internal star.json but I don't think we have the needed API
  // Install bower_components into the local meteor build.
  var packageRoot = path.dirname(compileStep._fullInputPath);
  var relativePath = path.relative(process.cwd(), packageRoot);
  var bowerDirectory = path.join(relativePath, rootBowerDirectory);

  // Convert 'smart.json' version spec object to an array format which
  //  is needed by 'bower.commands.install()'
  //  bower: {
  //    "foo": "1.2.3",
  //    "bar": "2.1.2",
  //    "baz": ""
  //  }
  //  =>
  //  ["foo#1.2.3", "foo#2.1.2", "baz"]
  var specs = _.map(tree.bower, function(version, name) {
    if (! _.isEmpty(version))
      return name + "#" + version;
    else
      return name;
  });

  // XXX We should test if we already have the dependency in local cache. See
  //  the Meteor-core work on the `constraint-solver` package. Is this already
  //  handled by the bower downloader?
  console.log("\n" + compileStep.packageName + ": updating bower dependencies...");

  var installedPackages = Meteor._wrapAsync(function(cb) {
    bower.commands
      .install(specs, {save: true}, {directory: bowerDirectory})
      .on('end', function (installed) {
        cb(null, _.each(installed, function(val, name) {
          pkgs[name] = val.pkgMeta.version;
        }));
      })
      .on('error', function(error) {
        cb(error, null);
      });
  })();

  if (_.isEmpty(installedPackages))
    console.log("Everything is up-to-date"); // XXX Useless?
  else
    console.log("Installed new bower packages: ", installedPackages);

  // XXX Loop over packages, look at each `.bower.json` attribute `main` and
  //  add the associated file to the Meteor bundle. Is there any bower function
  //  to load this file from a directory?

});
