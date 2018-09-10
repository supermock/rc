const util = require('util');
const EventEmitter = require('events');

function Mock() {
  EventEmitter.call(this);
}
util.inherits(Mock, EventEmitter);

Mock.prototype._ret = function(text) {
  return text + ' - OK!';
}

Mock.prototype.func = function(text) {
  return this._ret(text);
}

Mock.prototype.callback = function(text, callback) {
  callback(this._ret(text));
}

Mock.prototype.promise = function(text) {
  return new Promise(resolve => resolve(this._ret(text)));
}

Mock.prototype.longLiving = function() {
  let i = 0;
  let message = this._ret('Hello World');
  let id = setInterval(() => {
    if (i == 5) clearInterval(id);
    this.emit('LongLiving', `${message} (${i++})`);
  }, 1000);
}

module.exports = Mock;