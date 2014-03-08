var bower = Npm.require("bower");

var bowerCommands = ["info", "install", "link", "list", "lookup", "prune",
  "register", "search", "update", "uninstall"];

var bowerCommandSync = function (command) {
  return Meteor._wrapAsync(function() {
    arguments = _.toArray(arguments);
    var callback = arguments.pop();
    bower.commands[command]
      .apply(this, arguments)
      .on('end', function(res) {
        callback(null, res);
      })
      .on('error', function(err) {
        callback(err, null);
      });
  });
};

Bower = new Object();

_.forEach(bowerCommands, function (command) {
    Bower[command] = bowerCommandSync(command);
  }
);
