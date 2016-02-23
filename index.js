/*!
 * log-events <https://github.com/doowb/log-events>
 *
 * Copyright (c) 2016, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var Emitter = require('component-emitter');
var utils = require('./lib/utils');
var Mode = require('./lib/mode');
var Modifier = require('./lib/modifier');
var Stack = require('./lib/stack');

function create() {

  /**
   * Create a new `Logger` constructor to allow
   * updating the prototype without affecting other contructors.
   *
   * @api public
   */

  function Logger() {
    if (!(this instanceof Logger)) {
      return new Logger();
    }

    this.methods = {};
    this.modes = {};
    this.modifiers = {};
    this.stack = new Stack();
    // default logger "log"
    this.addLogger('log');
  }

  /**
   * Mixin `Emitter` prototype methods
   */

  Emitter(Logger.prototype);

  /**
   * Factory for creating emitting log messages.
   * This method is called internal for any logger or mode method that is
   * called as a function. To listen for events, listen for the logger name or
   * `'log'` when a mode is called as a method.
   *
   * Wildcard `*` may also be listened for and will get 2 arguments `(name, stats)` where
   * `name` is the event that was emitted and `stats` is the stats object for that event.
   *
   * ```js
   * // emit `info` when `info` is a logger method
   * logger.info('message');
   *
   * // emit `log` when `verbose` is a mode method
   * logger.verbose('message');
   *
   * // listen for all events
   * logger.on('*', function(name, stats) {
   *   console.log(name);
   *   //=> info
   * });
   *
   * logger.info('message');
   * ```
   *
   * @param  {String} `name` the name of the log event to emit. Example: `info`
   * @param  {String} `message` Message intended to be emitted.
   * @emits  {String, Object} `*` Wildcard emitter that emits the logger event name and stats object.
   * @emits  {Object} `name` Emitter that emits the stats object for the specified name.
   * @return {Object} `Logger` for chaining
   * @api public
   */

  Logger.prototype._emit = function(name/*, message*/) {
    var args = [].slice.call(arguments, 1);
    var logger = this.modifiers[name];
    if (!logger) {
      throw new Error('Unable to find logger "' + name + '"');
    }
    this.stack.setName(logger);
    this.stack.process(function(stats) {
      stats.args = args;
      this.emit.call(this, '*', stats.name, stats);
      this.emit.call(this, stats.name, stats);
    }, this);
    return this;
  };

  /**
   * Add a logger method to emit an event with the given `name`.
   *
   * ```js
   * // add a default `write` logger
   * logger.addLogger('write');
   *
   * // add a `red` logger that modifies the msg
   * logger.addLogger('red', {type: 'modifier'}, function(msg) {
   *   return colors.red(msg);
   * });
   *
   * // add an `info` logger that colors the msg
   * logger.addLogger('info', function(msg) {
   *   return colors.cyan(msg);
   * });
   *
   * // use the loggers:
   * logger.red.write('this is a read message');
   * logger.info('this is a cyan message');
   * ```
   *
   * @param  {String} `name` the name of the log event to emit
   * @param  {Object} `options` Options used when creating the logger method.
   * @param  {String|Array} `options.type` Type of logger method being created. Defaults to `logger`. Valid values are `['logger', 'modifier']`
   * @param  {Function} `fn` Optional modifier function that can be used to modify an emitted message.
   * @emits  {String} `addLogger` Emits name and new logger instance after adding the logger method.
   * @return {Object} `Logger` for chaining
   * @api public
   */

  Logger.prototype.addLogger = function(name, options, fn) {
    this.methods[name] = null;
    Object.defineProperty(Logger.prototype, name, {
      configurable: true,
      enumerable: true,
      get: buildLogger.call(this, name, options, fn),
      set: function(fn) {
        this.methods[name] = fn;
        return fn;
      }
    });
    this.emit('addLogger', name, this.modifiers[name]);
    return this;
  };

  /**
   * Add arbitrary modes to be used for creating namespaces for logger methods.
   *
   * ```js
   * // create a simple `verbose` mode
   * logger.addMode('verbose');
   *
   * // create a `not` toggle mode
   * logger.addMode('not', {type: 'toggle'});
   *
   * // create a `debug` mode that modifies the message
   * logger.addMode('debug', function(msg) {
   *   return '[DEBUG]: ' + msg;
   * });
   *
   * // use the modes with loggers from above:
   * logger.verbose.red.write('write a red message when verbose is true');
   * logger.not.verbose.info('write a cyan message when verbose is false');
   * logger.debug('write a message when debug is true');
   * ```
   *
   * @param  {String} `mode` Mode to add to the logger.
   * @param  {Object} `options` Options to describe the mode.
   * @param  {String|Array} `options.type` Type of mode being created. Defaults to `mode`. Valid values are `['mode', 'toggle']`
   *                                      `toggle` mode may be used to indicate a "flipped" state for another mode.
   *                                      e.g. `not.verbose`
   *                                      `toggle` modes may not be used directly for emitting log events.
   * @param  {Function} `fn` Optional modifier function that can be used to modify an emitted message.
   * @emits  {String} `addMode` Emits the name and new mode instance after adding the mode method.
   * @return {Object} `Logger` for chaining
   * @api public
   */

  Logger.prototype.addMode = function(mode, options, fn) {
    Object.defineProperty(Logger.prototype, mode, {
      configurable: true,
      enumerable: true,
      get: buildMode.call(this, mode, options, fn)
    });
    this.emit('addMode', mode, this.modes[mode]);
    return this;
  };

  /**
   * Create a logger getter function that can be used in chaining
   *
   * @param  {String} `name` the name of the log event to emit
   * @return {Function} getter function to be used in `defineProperty`
   */

  function buildLogger(name, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }
    var opts = utils.extend({name: name, type: 'logger', fn: fn}, options);
    var logger = new Modifier(opts);
    this.modifiers[name] = logger;

    return function() {
      if (utils.hasType(logger.type, 'logger')) {
        this.stack.addLogger(logger);
      } else {
        this.stack.addModifier(logger);
      }
      var method;
      if (typeof this.methods[name] === 'function') {
        method = this.methods[name];
      } else {
        method = function(/*message*/) {
          var args = [].slice.call(arguments);
          args.unshift(name);
          return this._emit.apply(this, args);
        }.bind(this);
        this.methods[name] = method;
      }
      method.__proto__ = Logger.prototype;
      return method;
    }.bind(this);
  }

  /**
   * Create an instance of a mode object that switches
   * the current `mode` of the logger.
   *
   * @param  {String} `mode` mode to set when getting this proeprty.
   * @return {Function} getter function to be used in `defineProperty`
   */

  function buildMode(name, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }
    var opts = utils.extend({name: name, type: 'mode', fn: fn}, options);
    var mode = new Mode(opts);
    this.modes[name] = mode;

    return function() {
      this.stack.addMode(mode);
      if (utils.hasType(mode.type, 'toggle')) {
        var ModeWrapper = function() {};
        var inst = new ModeWrapper();
        inst.__proto__ = Logger.prototype;
        return inst;
      }
      var method;
      if (typeof this.methods[name] === 'function') {
        method = this.methods[name];
      } else {
        method = function(/*message*/) {
          var args = [].slice.call(arguments);
          args.unshift('log');
          return this._emit.apply(this, args);
        }.bind(this);
        this.methods[name] = method;
      }
      method.__proto__ = Logger.prototype;
      return method;
    }.bind(this);
  }

  return Logger;
}

/**
 * Expose `logger-events`
 */

module.exports = create();

/**
 * Allow users to create a new Constructor
 */

module.exports.create = create;
