var path = Npm.require("path");
var fs = Npm.require("fs");

// Install bower_components into the local meteor build.
// XXX Should we find a better host?
var bowerHouse = ".meteor/local/bower_components";

log = function (message) {
  return console.log("Bower:", message);
};

var bowerHandler = function(compileStep, bowerTree) {

  if (! _.isObject(bowerTree))
    compileStep.error({
      message: "Bower list must be a dictionnary in " + compileStep.inputPath
    });

  var bowerDirectory = path.join(path.relative(process.cwd(),
                         path.dirname(compileStep._fullInputPath)), bowerHouse);

  // Convert 'smart.json' version spec object to an array format which
  //  is needed by 'bower.commands.install()'
  //  bower: {
  //    "foo": "1.2.3",
  //    "bar": "2.1.2"
  //  }
  //  =>
  //  ["foo#1.2.3", "foo#2.1.2"]
  var specs = _.map(bowerTree, function(version, name) {
    if (_.isEmpty(version))
      compileStep.error({
        message: "You must provide a version number for package " + name
      });

    return name + "#" + version;
  });

  // Bower handle the cache managment for us.
  var installedPackages = Bower.install(specs, {save: true},
                                                   {directory: bowerDirectory});
  _.each(installedPackages, function(val, pkgName) {
    log(pkgName + " v" + val.pkgMeta.version + " successfully installed");
  });

  // Loop over packages, look at each `.bower.json` attribute `main` and
  //  add the associated file to the Meteor bundle.
  // XXX If a package is present more than once (potentialy in different
  //  versions from different places), we should only include it once with the
  //  good version. Hopefully the `constraint-solver` package will help.
  _.each(bowerTree, function (version, pkgName) {
    var bowerInfosPath = path.join(bowerDirectory, pkgName, '.bower.json');
    var infos = loadJSONContent(compileStep, fs.readFileSync(bowerInfosPath));

    if (! _.has(infos, "main") || ! _.isString(infos.main))
      return;

    var ext = path.extname(infos.main)
    if (ext !== ".js") {
      log(ext + " extension is not supported yet");
      return;
    }

    var contentPath = path.join(bowerDirectory, pkgName, infos.main);
    var content = fs.readFileSync(contentPath).toString('utf8');
    var virtualPath = path.join('packages/bower/', pkgName, infos.main);
    compileStep.addJavaScript({
      path: virtualPath,
      sourcePath: contentPath,
      data: content,
      bare: true
    });
  });
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

// XXX Hack. If this line is not present `xxx.json` handlers are not called.
//  This is a Meteor bug.
Plugin.registerSourceHandler("json", null);

// We look at the field "bower" of the `smart.json` file.
// XXX Remove when atmosphere is merged in Meteor-core
Plugin.registerSourceHandler("smart.json", function (compileStep) {
  // XXX Code copied from `packages/templating/plugin/compile-template.js:6`
  if (! compileStep.arch.match(/^browser(\.|$)/))
    return;

  var bowerTree = loadJSONFile(compileStep);
  if (! _.has(bowerTree, "bower"))
    return;

  return bowerHandler(compileStep, bowerTree.bower);
});

Plugin.registerSourceHandler("bower.json", function (compileStep) {
  // XXX Code copied from `packages/templating/plugin/compile-template.js:6`
  if (! compileStep.arch.match(/^browser(\.|$)/))
    return;

  var bowerTree = loadJSONFile(compileStep);

  return bowerHandler(compileStep, bowerTree);
});
