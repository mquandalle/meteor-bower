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

If you don't want to use the `smart.json` file for that purpose, you can use a
dedicated file named `bower.json`.

## Contributing

Contributions are very welcome, whether it is for a
[bug report](https://github.com/mquandalle/meteor-bower/issues/new), a fix or a
new functionality proposition.

## Tips

If you would like to buy me a beer, I proudly accept bitcoin tips:
[1BowerXo5THZftsQa11G7EXv5cWX7A8ZZ7](https://blockchain.info/address/1BowerXo5THZftsQa11G7EXv5cWX7A8ZZ7)

## License

This code is published under the [MIT license](LICENSE).
