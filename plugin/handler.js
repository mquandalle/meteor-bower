var path = Npm.require("path");
var fs = Npm.require("fs");
var glob = Npm.require("glob");

log = function (message) {
  return console.log("Bower: ", message);
};

var bowerHandler = function (compileStep, bowerTree, bowerHome) {

  // instead of trying to restrict at the source handler
  // we're just going to check if the requested input path from
  // a list of potential json source matches bower.json filename
  var isBowerJson = compileStep.inputPath.indexOf("bower.json");

  // restrict to only bower.json handling
  if (isBowerJson > -1 ) {
    if (! _.isObject(bowerTree.dependencies))
      compileStep.error({
        message: "Bower dependencies list must be a dictionary in " + compileStep.inputPath
      });

    var bowerInstall = function (options) {
      options = _.extend(options || {}, {directory: bowerHome});
      return Bower.install([], { save: true, forceLatest: true }, options);
    };

    var mapBowerDefinitions = function (definition, name) {
      if (!_.isString(definition))
        compileStep.error({
          message: "Definitions in the bower list must be strings. " + compileStep.inputPath
        });

      if (definition.indexOf('/') !== -1)
        return name + "=" + definition;
      else
        return name + "#" + definition;
    };

    var cwd = path.dirname(compileStep._fullInputPath);
    // Convert bowerTree object to an array format needed by `Bower.install`:
    // dependencies: {
    //   "foo": "1.2.3",
    //   "bar": "owner/repo#2.1.2",
    //   "foobar": "git://github.com/owner/repo#branchortag"
    // }
    // =>
    // ["foo#1.2.3", "bar=owner/repo#2.1.2", "foobar=git://github.com/owner/repo#branchortag"]
    // Ref: https://github.com/bower/bower.json-spec#dependencies
    var installList = _.map(bowerTree.dependencies, mapBowerDefinitions);

    // Installation
    if (installList.length) {
      var installedPackages = [];
      // Try to install packages offline first.
      try {
        installedPackages = bowerInstall({ offline: true, cwd: cwd });
      } catch (e) {
        log(e);

        // In case of failure, try to fetch packages online
        try {
          installedPackages = bowerInstall({ cwd: cwd });
        } catch (f) {
          log(f);
        }
      }

      _.each(installedPackages, function (val, pkgName) {
         log(pkgName + " v" + val.pkgMeta.version + " successfully installed");
      });
    }

    // Get all packages in localCache and their dependencies recursively.
    var localCache = Bower.list(null, {offline: true, directory: bowerHome, cwd: cwd});
    var bowerDependencies = getDependencies(localCache);

    if (_.isArray(bowerTree.ignoredDependencies)) {
      bowerDependencies = _.filter(bowerDependencies, function(dep) {
        return ! _.contains(bowerTree.ignoredDependencies, dep.pkgName);
      });

    } else if (bowerTree.ignoredDependencies) {
      compileStep.error({
        message: "Bower ignoredDependencies must be an array in " + compileStep.inputPath
      });
    }

    // Loop over packages, look at each `.bower.json` attribute `main` and
    // add the associated file to the Meteor bundle.
    // XXX If a package is present more than once (potentialy in different
    // versions from different places), we should only include it once with the
    // good version. Hopefully the `constraint-solver` package will help.
    _.each(bowerDependencies, function (item) {
      var pkgName = item.pkgMeta._originalSource || item.pkgName;
      if (pkgName.indexOf('/') !== -1 || pkgName.indexOf('@') !== -1) {
        // it's a url, probably not what we are looking for
        pkgName = item.pkgMeta.name;
      }

      var pkgPath = path.join(cwd, bowerHome, pkgName);
      var infos = item.pkgMeta;

      // Bower overrides support
      if (bowerTree.overrides && bowerTree.overrides[pkgName]) {
        _.extend(infos, bowerTree.overrides[pkgName]);
      }

      compileArch = compileStep.arch === "os" ? "server" : "client";

      if (! _.has(infos, "arch"))
        infos.arch = ['client'];

      if ([].concat(infos.arch).indexOf(compileArch) === -1)
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
        var content;
        var ext;

        // Only load real files
        if (!fs.lstatSync(contentPath).isFile()) {
          return;
        }

        content = fs.readFileSync(contentPath);
        ext = path.extname(fileName).slice(1);

        // XXX It would be cool to be able to add a ressource and let Meteor use
        // the right source handler.
        if (ext === "js") {
          compileStep.addJavaScript({
            sourcePath: contentPath,
            path: virtualPath,
            data: content.toString('utf8'),
            bare: compileArch === "client"
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
  }
};

/****************/
/* JSON Loaders */
/****************/

var loadJSONContent = function (compileStep, content) {
  try {
    return JSON.parse(content);
  } catch (e) {
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
  } catch (e) { }

  return null;
};

var getDependencies = function( pkg, depth, list ){
  depth = depth || 0;
  list = list || [];
  var item = _.findWhere(list, {"pkgName": pkg.pkgMeta.name});
  if (item === undefined) {
    list.push({
      "pkgName": pkg.pkgMeta.name,
      "pkgMeta": pkg.pkgMeta,
      "depth": depth
    });
  } else {
    item.depth = depth;
  }
  _.each(pkg.dependencies, function(value, key){
    getDependencies(value, depth + 1, list);
  });
  return sortDependencies(list);
};

var sortDependencies = function(dependencies) {
  var sortedDependencies = [];
  var sorted = -1;
  while (sortedDependencies.length < dependencies.length && sorted < sortedDependencies.length) {
    sorted = sortedDependencies.length;
    _.each(dependencies, function (dependency) {
      var ok = false;
      if (sortedDependencies.indexOf(dependency) === -1) {
        ok = true;
        if (dependency.pkgMeta.dependencies) {
          _.each(_.keys(dependency.pkgMeta.dependencies), function (pkgName) {
            if (!_.findWhere(sortedDependencies, {pkgName: pkgName}))
              ok = false;
          });
        }
        if (ok)
          sortedDependencies.push(dependency);
      }
    });
  }
  return _.union(sortedDependencies, dependencies);
};

/*******************/
/* Source Handlers */
/*******************/
Plugin.registerSourceHandler("json", {}, function (compileStep) {
  var bowerTree = loadJSONFile(compileStep);
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
