var bower = Npm.require("bower");
var bowerCommands = ["info", "install", "link", "list", "lookup", "prune",
                     "register", "search", "update", "uninstall"];

Bower = {};

// Wrap every asynchronus bower command with `Meteor.wrapAsync`
_.forEach(bowerCommands, function (command) {
  Bower[command] = Meteor.wrapAsync(function() {
    argsArray = _.toArray(arguments);
    var callback = argsArray.pop();
    bower.commands[command]
      .apply(this, argsArray)
      .on('end', function(res) { callback(null, res); })
      .on('error', function(err) { callback(err, null); });
  });
});
