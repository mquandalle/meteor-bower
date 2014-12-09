# Bower for Meteor

[Bower](http://bower.io/) is a popular repository of client-side JavaScript
libraries. In the root of your Meteor app create the file `bower.json` and fill it out like so:

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

You now have `select2` and `backbone` libraries in your client application!

> To ensure that other people running your app will always get the exact same
dependencies you must always provide a version number.

# Referring to Bower downloaded assets

Bower for Meteor automatically adds the appropriate HTML tags to include your
Bower packages. In our example above we can *just start using* `select2` widgets
 and styles will be set correctly.

If you're curious just look at the HTML source of a rendered page!

Compare this to Bower out of the box, where you need to either manually
reference the included files or use something like
[grunt-bower-install](https://github.com/stephenplusplus/grunt-bower-install)
to reference them.


## Contributing

Contributions are very welcome, whether it is for a
[bug report](https://github.com/mquandalle/meteor-bower/issues/new), a fix or a
new functionality proposition.

## Tips

If you would like to buy me a beer, I proudly accept bitcoin tips:
[1BowerXo5THZftsQa11G7EXv5cWX7A8ZZ7](https://blockchain.info/address/1BowerXo5THZftsQa11G7EXv5cWX7A8ZZ7)

## License

This code is published under the [MIT license](LICENSE).
