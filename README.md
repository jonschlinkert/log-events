# log-events [![NPM version](https://img.shields.io/npm/v/log-events.svg?style=flat)](https://www.npmjs.com/package/log-events) [![NPM downloads](https://img.shields.io/npm/dm/log-events.svg?style=flat)](https://npmjs.org/package/log-events) [![Build Status](https://img.shields.io/travis/doowb/log-events.svg?style=flat)](https://travis-ci.org/doowb/log-events)

> Create custom, chainable logging methods that emit log events when called.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save log-events
```

## Usage

### [Logger](index.js#L23)

Create a new `Logger` constructor to allow
updating the prototype without affecting other contructors.

### [._emit](index.js#L82)

Factory for emitting log messages. This method is called internally for any emitter or mode method that is called as a function. To listen for events, listen for the emitter name or `'log'` when a mode is called as a method.

Wildcard `*` may also be listened for and will get 2 arguments `(name, stats)` where
`name` is the emitter that was emitted and `stats` is the stats object for that event.

**Params**

* `name` **{String}**: the name of the emitter event to emit. Example: `info`
* `message` **{String}**: Message intended to be emitted.
* `returns` **{Object}** `Logger`: for chaining

**Events**

* `emits`: `*` Wildcard emitter that emits the emitter event name and stats object.
* `emits`: `stats` Emitter that emits the stats object for the specified name.

**Example**

```js
// emit `info` when `info` is an emitter method
logger.info('message');

// emit `log` when `verbose` is a mode method
logger.verbose('message');

// listen for all events
logger.on('*', function(name, stats) {
  console.log(name);
  //=> info
});

logger.info('message');
```

### [.emitter](index.js#L127)

Add an emitter method to emit an event with the given `name`.

**Params**

* `name` **{String}**: the name of the emitter event to emit.
* `level` **{Number}**: Priority level of the emitter. Higher numbers are less severe. (Default: 100)
* `fn` **{Function}**: Optional emitter function that can be used to modify an emitted message. Function may be an existing style function.
* `returns` **{Object}** `this`: for chaining

**Events**

* `emits`: `emitter` Emits name and new emitter instance after adding the emitter method.

**Example**

```js
// add a default `write` emitter
logger.emitter('write');

// add some styles
logger.style('red', function(msg) {
  return colors.red(msg);
});
logger.style('cyan', function(msg) {
  return colors.cyan(msg);
});

// add an `info` logger that colors the msg cyan
logger.emitter('info', logger.cyan);

// use the loggers:
logger.red.write('this is a red message');
logger.info('this is a cyan message');
```

### [.mode](index.js#L173)

Add arbitrary modes to be used for creating namespaces for emitter methods.

**Params**

* `mode` **{String}**: Mode to add to the logger.
* `options` **{Object}**: Options to describe the mode.
* `options.type` **{String|Array}**: Type of mode being created. Defaults to `mode`. Valid values are `['mode', 'toggle']`. `toggle` mode may be used to indicate a "flipped" state for another mode. e.g. `not.verbose`. `toggle` modes may not be used directly for emitting log events.
* `fn` **{Function}**: Optional style function that can be used to stylize an emitted message.
* `returns` **{Object}** `this`: for chaining

**Events**

* `emits`: `mode` Emits the name and new mode instance after adding the mode method.

**Example**

```js
// create a simple `verbose` mode
logger.mode('verbose');

// create a `not` toggle mode
logger.mode('not', {type: 'toggle'});

// create a `debug` mode that modifies the message
logger.mode('debug', function(msg) {
  return '[DEBUG]: ' + msg;
});

// use the modes with styles and emitters from above:
logger.verbose.red.write('write a red message when verbose is true');
logger.not.verbose.info('write a cyan message when verbose is false');
logger.debug('write a message when debug is true');
```

### [.style](index.js#L193)

Create a logger `style` with the given `fn`.

**Params**

* `style` **{String}**: The name of the style to create.
* `fn` **{Function}**
* `returns` **{Object}**: Returns the instance for chaining.

**Events**

* `emits`: `style`

### [Mode](lib/mode.js#L18)

Mode constructor for making a mode object when
a mode is created with `logger.mode()`

**Params**

* `options` **{Object}**: Options to configure the mode.
* `options.name` **{String}**: Required name of the mode
* `options.type` **{String|Type}**: Type of mode to create. Defaults to `mode`. Values may be `['mode', 'toggle']`.

### [type](lib/mode.js#L45)

Type of `mode`. Valid types are ['mode', 'toggle']

**Example**

```js
console.log(verbose.type);
//=> "mode"
console.log(not.type);
//=> "toggle"
```

### [name](lib/mode.js#L71)

Readable name of `mode`.

**Example**

```js
console.log(verbose.name);
//=> "verbose"
console.log(not.name);
//=> "not"
```

### [fn](lib/mode.js#L99)`fn`

Optional modifier function that accepts a value and returns a modified value. When not present, an identity function is used to return the original value.

**Example**

```js
var msg = "some error message";

// wrap message in ansi codes for "red"
msg = red.fn(msg);
console.log(msg);

//=> "\u001b[31msome error message\u001b[39m";
```

### [Stats](lib/stats.js#L33)

Stats contructor that contains information about a chained event being built up.

**Params**

* `parent` **{Object}**: Optional stats instance to inherit `modes` and `styles` from.

**Example**

```js
{
  // "not" => toggle, "verbose" => mode
  modes: ['not', 'verbose'],

  // "red" => modifier
  styles: ['red'],

  // specified when emitter is created
  level: 1,

  // name of emitter that will trigger an event
  // in this case "red" will not trigger an event
  name: 'subhead',

  // arguments passed into emitter function "subhead"
  args: ['foo', 'bar', 'baz']
}
```

### [.addMode](lib/stats.js#L82)

Add a mode to the `modes` array for this stats object.

**Params**

* `mode` **{Object}**: Instance of a Mode to add to the stats object.
* `returns` **{Object}** `this`: for chaining.

**Example**

```js
var verbose = new Mode({name: 'verbose'});
stats.addMode(verbose);
```

### [.getModes](lib/stats.js#L103)

Get the array of modes from the stats object. Optionally, pass a property in and return an array with only the property.

**Params**

* `prop` **{String}**: Optional property to pick from the mode objects to return.
* `returns` **{Array}**: Array of modes or mode properties.

**Example**

```js
var modes = stats.getModes();
//=> [{name: 'verbose'}]
var modeNames = stats.getModes('name');
//=> ['verbose']
```

### [.addStyle](lib/stats.js#L122)

Add a style to the `styles` array for this stats object.

**Params**

* `style` **{String}**: Name of style to add.
* `returns` **{Object}** `this`: for chaining.

**Example**

```js
stats.addStyle('red');
```

### [.addEmitter](lib/stats.js#L139)

Sets the emitter for this stats object to indicate this is a complete stats object ready to be emitted.

**Params**

* `emitter` **{Object}**: Instance of a Emitter to add to the stats object.
* `returns` **{Object}** `this`: for chaining.

**Example**

```js
var info = new Emitter({name: 'info'});
stats.addEmitter(info);
```

## About

### Related projects

* [falsey](https://www.npmjs.com/package/falsey): Returns true if `value` is falsey. Works for strings, arrays and `arguments` objects with a… [more](https://github.com/jonschlinkert/falsey) | [homepage](https://github.com/jonschlinkert/falsey "Returns true if `value` is falsey. Works for strings, arrays and `arguments` objects with a length of `0`, and objects with no own enumerable properties are considered falsey.")
* [is-enabled](https://www.npmjs.com/package/is-enabled): Using key paths that may contain "falsey" patterns, check if a property on an object… [more](https://github.com/doowb/is-enabled) | [homepage](https://github.com/doowb/is-enabled "Using key paths that may contain "falsey" patterns, check if a property on an object is enabled.")
* [verbalize](https://www.npmjs.com/package/verbalize): A pluggable logging utility with built-in colors, styles, and modes. | [homepage](https://github.com/jonschlinkert/verbalize "A pluggable logging utility with built-in colors, styles, and modes.")

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

### Building docs

_(This document was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme) (a [verb](https://github.com/verbose/verb) generator), please don't edit the readme directly. Any changes to the readme must be made in [.verb.md](.verb.md).)_

To generate the readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install -g verb verb-generate-readme && verb
```

### Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

### Author

**Brian Woodward**

* [github/doowb](https://github.com/doowb)
* [twitter/doowb](http://twitter.com/doowb)

### License

Copyright © 2016, [Brian Woodward](https://github.com/doowb).
Released under the [MIT license](https://github.com/doowb/log-events/blob/master/LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.1.31, on September 18, 2016._