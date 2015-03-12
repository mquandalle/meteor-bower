var path = Npm.require("path");
var fs = Npm.require("fs");
var glob = Npm.require("glob");

log = function (message) {
  return console.log("Bower: ", message);
};

var bowerHandler = function (compileStep, bowerTree, bowerHome) {

  if (! _.isObject(bowerTree.dependencies))
    compileStep.error({
      message: "Bower dependencies list must be a dictionary in " + compileStep.inputPath
    });

  mapBowerDefinitions = function (definition, name) {
    if (!_.isString(definition))
      compileStep.error({
        message: "Definitions in the bower list must be strings. " + compileStep.inputPath
      });

    if (definition.indexOf('/') != -1)
      return name + "=" + definition;
    else
      return name + "#" + definition;
  };

  var cwd = path.dirname(compileStep._fullInputPath);
  // Convert bowerTree object to an array format needed by `Bower.install`:
  //  dependencies: {
  //    "foo": "1.2.3",
  //    "bar": "owner/repo#2.1.2",
  //    "foobar": "git://github.com/owner/repo#branchortag"
  //  }
  //  =>
  //  ["foo#1.2.3", "bar=owner/repo#2.1.2", "foobar=git://github.com/owner/repo#branchortag"]
  //  Ref: https://github.com/bower/bower.json-spec#dependencies
  var installList = _.map(bowerTree.dependencies, mapBowerDefinitions);

  // Installation
  if (installList.length) {
    var installedPackages = [];
    // Try to install packages offline first.
    try {
      installedPackages = Bower.install([], {save: true, forceLatest: true}, {directory: bowerHome, offline: true, cwd: cwd});
    }
    catch( e ) {
      log( e );
      // In case of failure, try to fetch packages online
      try {
        installedPackages = Bower.install([], {save: true, forceLatest: true}, {directory: bowerHome, cwd: cwd});
      }
      catch( e ) {
        log( e );
      }
    }
    _.each(installedPackages, function (val, pkgName) {
       log(pkgName + " v" + val.pkgMeta.version + " successfully installed");
    });
  }

  // Get all packages in localCache and their dependencies recursively.
  // Order packages by descending depth so that packages get inlcuded in the correct order
  var localCache = Bower.list(null, {offline: true, directory: bowerHome, cwd: cwd});
  var bowerDependencies = _.chain(getDependencies(localCache)).sortBy("depth").reverse().value();

  if (_.isArray(bowerTree.ignoredDependencies)) {
    bowerDependencies = _.filter(bowerDependencies, function(dep) {
        return !(_.contains(bowerTree.ignoredDependencies, dep.pkgName));

    });
  } else if (bowerTree.ignoredDependencies) {
    compileStep.error({
      message: "Bower ignoredDependencies must be an array in " + compileStep.inputPath
    });
  }

  // Loop over packages, look at each `.bower.json` attribute `main` and
  //  add the associated file to the Meteor bundle.
  // XXX If a package is present more than once (potentialy in different
  //  versions from different places), we should only include it once with the
  //  good version. Hopefully the `constraint-solver` package will help.
  _.each(bowerDependencies, function (item) {
    var pkgName = item.pkgMeta._originalSource || item.pkgName;
    var pkgPath = path.join(cwd, bowerHome, pkgName);
    var infos = item.pkgMeta;

    // Bower overrides support
    if (bowerTree.overrides && bowerTree.overrides[pkgName]) {
      _.extend(infos, bowerTree.overrides[pkgName]);
    }


    compileArch = compileStep.arch === "os" ? "server" : "client";

    if (! _.has(infos, "arch"))
      infos.arch = ['client'];

    if([].concat(infos.arch).indexOf(compileArch) == -1)
      return;

    if (! _.has(infos, "main"))
      return;

    if (_.isString(infos.main))
      infos.main = [infos.main];

    toInclude = [];
    if (infos.main)
      toInclude = toInclude.concat(infos.main);

    var matches = function (files) {
      return _.map(files, function(pattern) {
        return glob.sync(pattern, { cwd: pkgPath });
      });
    };
    toInclude = _.uniq(_.flatten(matches(toInclude)));

    _.each(toInclude, function (fileName) {
      var contentPath = path.join(pkgPath, fileName);
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
          bare: compileArch === "client" ? true : void 0
        });
      } else if (ext === "css") {
        if (compileArch === "server")
          return;
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

var getDependencies = function( pkg, depth, list ){
  depth = depth || 0;
  list = list || [];
  var item = _.findWhere(list, {"pkgName": pkg.pkgMeta.name});
  if( item === undefined ){
    list.push({
      "pkgName": pkg.pkgMeta.name,
      "pkgMeta": pkg.pkgMeta,
      "depth": depth
    });
  }
  else{
    item.depth = depth;
  }
  _.each(pkg.dependencies, function(value, key){
    getDependencies(value, depth+1, list );
  });
  return list;
};

/*******************/
/* Source Handlers */
/*******************/

// XXX Hack. If this line is not present `xxx.json` handlers are not called.
//  This is a Meteor bug.
Plugin.registerSourceHandler("json", null);

Plugin.registerSourceHandler("bower.json", {}, function (compileStep) {
  var bowerTree = loadJSONFile(compileStep);

  //
  // Parse .bowerrc file if exists in the same folder as bower.json
  //
  // Install bower components into the local meteor directory.
  // XXX Should we find a better host?
  var bowerHome = ".meteor/local/bower";
  var bowerrc = parseJSONFile(path.dirname(compileStep._fullInputPath) + '/.bowerrc');
  if (bowerrc && _.has(bowerrc, "directory"))
    bowerHome = bowerrc.directory;

  return bowerHandler(compileStep, bowerTree, bowerHome);
});
