var path = Npm.require("path");
var bower = Npm.require("bower");

// XXX Should find a better host
var rootBowerDirectory = ".meteor/local/bower_components";

var bowerHandler = function(compileStep, bowerTree) {

  if (! _.isObject(bowerTree))
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
  var specs = _.map(bowerTree, function(version, name) {
    if (! _.isEmpty(version))
      return name + "#" + version;
    else
      return name;
  });

  // Bower handle cache managment for us.
  var installedPackages = Meteor._wrapAsync(function(cb) {
    var logInstallation = false;
    bower.commands
      .install(specs, {save: true}, {directory: bowerDirectory})
      .on('log', function(log) {
        if (!logInstallation && log.id === "install")
          console.log("Bower: install packages...");
      })
      .on('end', function (installed) {
        var pkgs = {};
        _.each(installed, function(val, name) {
          pkgs[name] = val.pkgMeta.version;
        });
        cb(null ,pkgs);
      })
      .on('error', function(error) {
        cb(error, null);
      });
  })();

  if (! _.isEmpty(installedPackages))
    console.log("Bower: ", installedPackages);

  // XXX Loop over packages, look at each `.bower.json` attribute `main` and
  //  add the associated file to the Meteor bundle. Is there any bower function
  //  to load this file from a directory?

}

/****************/
/* JSON Loaders */
/****************/

var loadJSONContent = function(compileStep, content) {
  try {
    return JSON.parse(content);
  }
  catch (e) {
    compileStep.error({
      message: "Syntax error in " + compileStep.inputPath,
      line: e.line,
      column: e.column
    });
  }
};

var loadJSONFile = function(compileStep) {
  var content = compileStep.read().toString('utf8');
  return loadJSONContent(compileStep, content);
};

/*******************/
/* Source Handlers */
/*******************/

// XXX Hack. If this line is not present `xxx.json` handlers is not called. This
//  is a Meteor bug.
Plugin.registerSourceHandler("json", null);

// We look at the field "bower" of the `smart.json` file.
// XXX Remove when atmosphere is merged in Meteor-core
Plugin.registerSourceHandler("smart.json", function (compileStep) {
  // XXX Code copied from
  // packages/templating/plugin/compile-template.js:6
  if (! compileStep.arch.match(/^browser(\.|$)/))
    return;

  var bowerTree = loadJSONFile(compileStep);
  if (! _.has(bowerTree, "bower"))
    return;

  return bowerHandler(compileStep, bowerTree.bower);
});

Plugin.registerSourceHandler("bower.json", function (compileStep) {
  // XXX Code copied from
  // packages/templating/plugin/compile-template.js:6
  if (! compileStep.arch.match(/^browser(\.|$)/))
    return;

  var bowerTree = loadJSONFile(compileStep);

  return bowerHandler(compileStep, bowerTree);
});
