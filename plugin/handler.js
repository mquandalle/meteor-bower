var path = Npm.require("path");
var fs = Npm.require("fs");
var glob = Npm.require("glob");

// Install bower components into the local meteor directory.
// XXX Should we find a better host?
var bowerHome = ".meteor/local/bower";

log = function (message) {
  return console.log("Bower: ", message);
};

var bowerHandler = function (compileStep, bowerTree) {

  if (! _.isObject(bowerTree))
    compileStep.error({
      message: "Bower list must be a dictionnary in " + compileStep.inputPath
    });

  var bowerDirectory = path.join(path.relative(process.cwd(),
                          path.dirname(compileStep._fullInputPath)), bowerHome);

  // Convert bowerTree object to an array format needed by `Bower.install`:
  //  dependencies: {
  //    "foo": "1.2.3",
  //    "bar": "owner/repo#2.1.2"
  //  }
  //  =>
  //  ["foo#1.2.3", "bar=owner/repo#2.1.2"]
  var installList = _.map(bowerTree, function (definition, name) {
    if (_.isString(definition))
    {
      var repo = definition.split("#");
      if( repo.length>1 ) definition = {source: repo[0], version: repo[1]};
      else definition = { version: definition };
    }

    if (_.isEmpty(definition.version))
      compileStep.error({
        message: "You must provide a version number for package " + name
      });

    if (_.has(definition, "source"))
      name += "=" + definition.source;

    return name + "#" + definition.version;
  });

  // `localCache` use the same format than `installList`:
  // ["foo#1.2.3", "foo#2.1.2"]
  // If a value is present in `localCache` we remove it from the `installList`
  var localCache = Bower.list(null, {offline: true, directory: bowerDirectory});
  localCache = _.values(localCache.pkgMeta.dependencies);
  installList = _.filter(installList, function (pkg) {
    return localCache.indexOf(pkg) === -1;
  });

  // Installation
  if (installList.length) {
    var installedPackages = Bower.install(installList, {save: true}, {directory: bowerDirectory});
    _.each(installedPackages, function (val, pkgName) {
      log(pkgName + " v" + val.pkgMeta.version + " successfully installed");
    });
  }

  // Loop over packages, look at each `.bower.json` attribute `main` and
  //  add the associated file to the Meteor bundle.
  // XXX If a package is present more than once (potentialy in different
  //  versions from different places), we should only include it once with the
  //  good version. Hopefully the `constraint-solver` package will help.
  _.each(bowerTree, function (options, pkgName) {
    var bowerInfosPath = path.join(bowerDirectory, pkgName, '.bower.json');
    var infos = loadJSONContent(compileStep, fs.readFileSync(bowerInfosPath));

    if (! _.has(infos, "main") && ! options.additionalFiles)
      return;

    if (_.isString(infos.main))
      infos.main = [infos.main];

    toInclude = [];
    if (infos.main)
      toInclude = toInclude.concat(infos.main);

    if (options.additionalFiles) {
      if (_.isString(options.additionalFiles))
        options.additionalFiles = [options.additionalFiles];

      toInclude = toInclude.concat(options.additionalFiles);
    }

    var matches = function (files) {
      var pkgPath = path.join(bowerDirectory, pkgName);
      return _.map(files, function(pattern) {
        return glob.sync(pattern, { cwd: pkgPath });
      });
    };
    toInclude = _.uniq(_.flatten(matches(toInclude)));

    _.each(toInclude, function (fileName) {
      var contentPath = path.join(bowerDirectory, pkgName, fileName);
      var virtualPath = path.join('packages/bower/', pkgName, fileName);
      var content = fs.readFileSync(contentPath);
      var ext = path.extname(fileName).slice(1);

      // XXX It would be cool to be able to add a ressource and let Meteor use
      //  the right source handler.
      if (ext === "js") {
        compileStep.addJavaScript({
          sourcePath: contentPath,
          path: virtualPath,
          data: content.toString('utf8'),
          bare: true
        });
      } else if (ext === "css") {
        compileStep.addStylesheet({
          sourcePath: contentPath,
          path: virtualPath,
          data: content.toString('utf8')
        });
      } else {
        compileStep.addAsset({
          sourcePath: contentPath,
          path: virtualPath,
          data: content
        });
      }
    });
  });
};

/****************/
/* JSON Loaders */
/****************/

var loadJSONContent = function (compileStep, content) {
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

var loadJSONFile = function (compileStep) {
  var content = compileStep.read().toString('utf8');
  return loadJSONContent(compileStep, content);
};

var parseJSONFile = function(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  catch (e) { }

  return null;
};

//
// Parse ./.bowerrc file if exists in the project's root folder.
//
var bowerrc = parseJSONFile('./.bowerrc');
if(bowerrc && _.has(bowerrc, "directory")) bowerHome = bowerrc.directory;

/*******************/
/* Source Handlers */
/*******************/

// XXX Hack. If this line is not present `xxx.json` handlers are not called.
//  This is a Meteor bug.
Plugin.registerSourceHandler("json", null);

Plugin.registerSourceHandler("bower.json", {archMatching: "web"}, function (compileStep) {
  var bowerTree = loadJSONFile(compileStep);

  // bower.json files have additional metadata beyond what we care about (dependancies)
  // but previous versions of this package assumed it was a flatter list
  // so allow both
  if (_.has(bowerTree, "dependencies"))
    bowerTree = bowerTree.dependencies;

  return bowerHandler(compileStep, bowerTree);
});
