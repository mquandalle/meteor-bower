# Bower for Meteor

> *Warning* This is a Work In Progress, not working yet.

The goal of this package is to extends
[meteorite](http://oortcloud.github.io/meteorite/) to supports
[bower](http://bower.io/) packages.

In your `smart.json` you can specify an array of bower packages to install:

```json
{
  "meteor": { ... },
  "packages": { ... },
  "bower": {
    "select2": "3.4.5",
    "backbone": "1.1.0"
  }
}
```

To ensure that other people running your app will get the exact same
dependencies you must always provide a version number.

## Todo

- Find a home for bower packages
- Retreive content provided in the `main` field (we should give this content
  to the good source handler)
- Show a download progress bar in the console

## Contribute

Contributions are very welcome, whether it is for a
[bug report](https://github.com/mquandalle/meteor-bower/issues/new), a fix or a
new functionnality proposition.

## License

This code is published under the [MIT license](LICENSE).
