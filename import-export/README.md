# Examples using streams in rethinkdbdash

This repository show simple examples on how to use streams with rethinkdbdash.

### Install:

```
npm install
```


### Commands

Export your data:
```
node export.js
```

Import your data:
```
node import.js
```

Run the scripts with `--help` for more options.

### Interesting snippets

The interesting snippets are:

```js
// Pipe a RethinkDB table to a file
r.db(db).table(table).toStream({timeFormat: 'raw', binaryFormat: 'raw'})
  .on('error', _handleError)
  .pipe(Stringify())
  .on('error', _handleError)
  .pipe(fs.createWriteStream(dir+'/'+db+'.'+table+'.txt'))
  .on('error', _handleError)
  .on('finish', cb);
```

```js
// Pipe a file to a RethinkDB table
fs.createReadStream(file)
  .on('error', _handleError)
  .pipe(split(JSON.parse))
  .on('error', _handleError)
  .pipe(r.db(db).table(table).toStream({writable: true}))
  .on('finish', cb);
```


### Learn more about rethinkdbdash ###

* [Official repo](https://github.com/neumino/rethinkdbdash)
* [Examples](https://github.com/neumino/rethinkdbdash-examples)


### Learn more about RethinkDB ###

* [Advancing the realtime web](http://rethinkdb.com/blog/realtime-web/)
* [RethinkDB vs today's NoSQL](http://www.rethinkdb.com/blog/mongodb-biased-comparison/)
* [Quickstart](http://rethinkdb.com/docs/quickstart/)
* [API reference](http://rethinkdb.com/api/javascript/)


### Learn more about Streams ###

* [API Reference](https://nodejs.org/api/stream.html)



### License ###

MIT

Copyright (c) 2013-2014 Michel Tu <orphee@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the 'Software'), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
