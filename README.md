# Bower for Meteor

[Bower.io](http://bower.io/) is a popular repository of client-side JavaScript
libraries.

## Usage

To use it in your meteor application, create a `bower.json` file:

```json
{
  "name": "my-app",
  "version": "0.0.1",
  "dependencies": {
    "select2": "3.4.5",
    "backbone": "1.1.0"
  },
  "private": true
}
```

If you want to use a bower library at script load time (outside of a
`Meteor.startup` block, template handler, event, etc), you have to place the
`bower.json` file so that it loads first (see [Meteor load
order](http://stackoverflow.com/questions/10693113/how-do-i-change-the-order-in-
which-meteor-loads-javascript-files)). Take the deepest directory you have
inside `[project root]/lib/`, add a `bower` directory, and put `bower.json`
there. So for example, if you currently have no directories in `lib/`, then you
can do `lib/bower/bower.json`, but if your current structure is `lib/foo/bar/`,
then you should do `lib/foo/bar/bower/bower.json`.

The next time you run `meteor`, the `select2` and `backbone` libraries will be
downloaded, and the appropriate HTML tags to include those libraries will
automatically be added to your app. So you can *just start using* `select2`
widgets, and styles will be set correctly. (If you're curious just look at the
HTML source of a rendered page!) We use the `main` section of the library's
`bower.json` file to determine which files should be loaded. 

**If the package
you're adding doesn't use the `main` section:** you can choose which files you
want by adding an `override` field to your `bower.json` as described in
[#54](https://github.com/mquandalle/meteor-bower/pull/54).

Compare this to just using the `bower` command, where you need to either manually
reference the included files or use something like
[grunt-bower-install](https://github.com/stephenplusplus/grunt-bower-install)
to reference them.

### Using `bower --save`
If you want to use the `bower install <package> --save` command, you can add
this `.bowerrc` file in the project root directory:

```json
{
  "directory": ".meteor/local/bower"
}
```

### Raw files
If you need to reference the raw files (eg Polymer components in html files),
you can set a different directory, eg "public/bower", and include those files
manually in your `<head>`. 

### Limit package scope
Make `modernizr` only available on the client by setting the `arch` in your `bower.json`:

```
"overrides": {
  "modernizr": {
      "arch": [ "client" ]
    }
}
```

Other values include `[ "server" ]` and `[ "client", "server" ]`.
  

### Excluding dependencies
You can ask `meteor-bower` to ignore a list of dependencies. For instance if you
have the Meteor package `reactjs:react` and the bower package `react-bootstrap`,
and you don't want `meteor-bower` to include a duplicate copy of react, add an
`ignoredDependencies` array to your `bower.json`:

```json
{
  "name": "my-app",
  "version": "0.0.1",
  "dependencies": {
    "select2": "3.4.5",
    "react-bootstrap": "~0.16.1"
  },
  "ignoredDependencies": [
    "react"
  ]
}
```

### Multiple package directories
You can also have multiple 
`bower.json` files, each paired with a `.bowerrc`, for instance:

```json
bower.json:
{
  "dependencies": {
    "select2": "3.4.5"
  }
  ...
}
.bowerrc
{
  "directory": ".meteor/local/bower"
}

lib/bower.json:
{
  "dependencies": {
    "polymer": "~0.5.1"
  }
  ...
}
lib/.bowerrc:
{
  "directory": "../public/bower"
}
```

## Contributing

Contributions are very welcome, whether it is a [bug report][bug-tracker] or a
PR with a fix or enhancement.

## License

This code is published under the [MIT license](LICENSE).

[bug-tracker]: https://github.com/mquandalle/meteor-bower/issues/new
