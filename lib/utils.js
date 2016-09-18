'use strict';

var utils = require('lazy-cache')(require);
var fn = require;
require = utils; // eslint-disable-line no-native-reassign

/**
 * Lazily required module dependencies
 */

require('define-property', 'define');
require('extend-shallow', 'extend');
require('get-value', 'get');
require('set-value', 'set');
require('union-value', 'union');
require('use');
require = fn; // eslint-disable-line no-native-reassign

/**
 * Cast `val` to an array
 *
 * @param  {String|Array} `val`
 * @return {Array}
 */

utils.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

utils.last = function(arr) {
  if (Array.isArray(arr)) {
    return arr[arr.length - 1];
  }
};

utils.isLast = function(arr, val) {
  return utils.last(arr) === val;
};

utils.hasType = function(types, key) {
  return types.indexOf(key) !== -1;
};

utils.assertType = function(types, keys) {
  keys.forEach(function(key) {
    if (!utils.hasType(types, key)) {
      throw new Error('"type" must be one of [' + types.join(', ') + '] but got "' + key + '"');
    }
  });
};

utils.identity = function(val) {
  return val;
};

/**
 * Expose `utils` modules
 */

module.exports = utils;
