const util = require('util');

Array.prototype.matchResults = function(what) {
  return this.filter(function(item) {
      return typeof item == 'string' && item.indexOf(what) > -1;
  });
}

Array.prototype.matchIndexes = function(what) {
  let indexes = [];

  for(let i = 0; i < this.length; i++) {
    if (typeof this[i] == 'string' && this[i].indexOf(what) > -1) {
      indexes.push(i);
    }
  }

  return indexes;
}

// /**
//  * RCType.Function
//  */
// response = {
//   error: null,
//   payload: {
//     throw: null,
//     arg: "Olá mundo"
//   }
// };
// /**
//  * RCType.Callback
//  */
// response = {
//   error: null,
//   payload: {
//     index: 0,
//     args: [1,2,3]
//   }
// };
// /**
//  * RCType.Promise
//  */
// response = {
//   error: null,
//   payload: {
//     then: args,
//     catch: args
//   }
// };
// /**
//  * RCType.LongLiving
//  */
// response = {
//   error: null,
//   payload: {
//     index: 0,
//     args: [1,2,3]
//   }
// };
const RCType = {
  Function: 1, //return
  Callback: 2, //callback()
  Promise: 3, //.then().catch()
  LongLiving: 4, //on()
  UnrefFunc: 5,
  name(id) {
    const name = Object.keys(this).filter(key => this[key] == id);
    return name.length ? name[0] : null;
  }
};

function RCError(message, extra) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.extra = extra;
}
util.inherits(RCError, Error);

function normalizeToRCError(error) {
  if (error instanceof RCError) {
    return error;
  }

  if (error instanceof Error) {
    return new RCError(error.message);
  }
  
  error.__proto__ = RCError.prototype;
  return error;
}

module.exports = {
  normalizeToRCError,
  RCType,
  RCError
};