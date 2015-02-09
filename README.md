# Bower for Meteor

[Bower.io](http://bower.io/) is a popular repository of client-side JavaScript
libraries. Create a `bower.json` file:

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

If you want to use a bower library at script load time (outside of a `Meteor.startup` block, template handler, event, etc), you have to place the `bower.json` file so that it loads first (see [Meteor load order](http://stackoverflow.com/questions/10693113/how-do-i-change-the-order-in-which-meteor-loads-javascript-files)). Take the deepest directory you have inside `[project root]/lib/`, add a `bower` directory, and put `bower.json` there. So for example, if you currently have no directories in `lib/`, then you can do `lib/bower/bower.json`, but if your current structure is `lib/foo/bar/`, then you should do `lib/foo/bar/bower/bower.json`. 

The next time you run `meteor`, the `select2` and `backbone` libraries will be 
downloaded, and the appropriate HTML tags to include those libraries will 
automatically be added to your app. So you can *just start using* `select2` 
widgets, and styles will be set correctly. (If you're curious just look at the 
HTML source of a rendered page!) We use the `main` section of the library's `bower.json` file to determine which files should be loaded. If the package you're trying to add doesn't use the `main` section, you must reference the files manually. @leebenson recommends using [meteor-preloader](https://github.com/MiroHibler/meteor-preloader) to help with that.

Compare this to just using the `bower` command, where you need to either manually
reference the included files or use something like
[grunt-bower-install](https://github.com/stephenplusplus/grunt-bower-install)
to reference them.

If you want to use the `bower install <package> --save` command, you can add this `.bowerrc` file in the project root directory:

```
{
  "directory" : ".meteor/local/bower"
}
```

If you need to reference the raw files (eg Polymer components in html files), you can set a different directory, eg "public/bower". TODO: allow multiple installation directories #49.

## Contributing

Contributions are very welcome, whether it is a
[bug report](https://github.com/mquandalle/meteor-bower/issues/new) or a PR with a fix or enhancement. 

## Tips

If you would like to buy me a beer, I proudly accept bitcoin tips:
[1BowerXo5THZftsQa11G7EXv5cWX7A8ZZ7](https://blockchain.info/address/1BowerXo5THZftsQa11G7EXv5cWX7A8ZZ7)

## License

This code is published under the [MIT license](LICENSE).
