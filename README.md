# Bower for Meteor

[Bower](http://bower.io/) is a popular repository of client-side JavaScript
libraries. In your `smart.json` you can specify a dictionary of bower packages:

```json
{
  "packages": {
    "bower": {}
  },
  "bower": {
    "select2": "3.4.5",
    "backbone": "1.1.0"
  }
}
```

You now have `select2` and `backbone` libraries in your client application!

> To ensure that other people running your app will always get the exact same
dependencies you must always provide a version number.

If the package you want to use isn't published on
[bower.io](http://bower.io/search/), you can specify a source with the following
syntax:

```json
{
  "packages": {
    "bower": {}
  },
  "bower": {
    "chui": {
      "source": "sourcebits-robertbiggs/bower-chui",
      "version": "3.5.2"
    }
  }
}
```

Where `source` can be either:

* A name that maps to a package registered with Bower (default), e.g, `jquery`.
* A public remote Git or Subversion endpoint, e.g.,
`git://github.com/someone/some-package.git`.
* A private Git or Subversion repository using *ssh* to authenticate with the
user's ssh public/private keys, e.g., `git@github.com:someone/some-package.git`.
* A shorthand endpoint, e.g., `someone/some-package` (defaults to GitHub).
* A local endpoint, i.e., a folder that's a Git or Subversion repository.
* A URL to a file, including zip and tar files.

If the package that you want to use doesn't have a main field in its bower.json
or you want to include additional files, you may specify those using
`additionalFiles`:

```json
{
  "packages": {
    "bower": {}
  },
  "bower": {
    "elastic.js": {
      "version": "~1.1.1",
      "additionalFiles": [
        "dist/elastic-jquery-client.js"
      ]
    }
  }
}
```

> If you don't want to use the `smart.json` file for that purpose, you can use a
dedicated file named `bower.json`.

# Referring to Bower downloaded assets

Bower for Meteor automatically adds the appropriate HTML tags to include your Bower packages. In our example above we can *just start using* `select2` widgets and styles will be set correctly.

If you're curious just look at the HTML source of a rendered page!

Compare this to Bower out of the box, where you need to either manually reference the included files or use something like [grunt-bower-install](https://github.com/stephenplusplus/grunt-bower-install) to reference them. 


## Contributing

Contributions are very welcome, whether it is for a
[bug report](https://github.com/mquandalle/meteor-bower/issues/new), a fix or a
new functionality proposition.

## Tips

If you would like to buy me a beer, I proudly accept bitcoin tips:
[1BowerXo5THZftsQa11G7EXv5cWX7A8ZZ7](https://blockchain.info/address/1BowerXo5THZftsQa11G7EXv5cWX7A8ZZ7)

## License

This code is published under the [MIT license](LICENSE).
