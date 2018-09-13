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
//  * RCRType.Function
//  */
// response = {
//   error: null,
//   payload: {
//     throw: null,
//     arg: "Olá mundo"
//   }
// };
// /**
//  * RCRType.Callback
//  */
// response = {
//   error: null,
//   payload: {
//     index: 0,
//     args: [1,2,3]
//   }
// };
// /**
//  * RCRType.Promise
//  */
// response = {
//   error: null,
//   payload: {
//     then: args,
//     catch: args
//   }
// };
// /**
//  * RCRType.LongLiving
//  */
// response = {
//   error: null,
//   payload: {
//     index: 0,
//     args: [1,2,3]
//   }
// };
const RCRType = {
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

function RCRError(message, extra) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.extra = extra;
}
util.inherits(RCRError, Error);

function normalizeToRCRError(error) {
  if (error instanceof RCRError) {
    return error;
  }

  if (error instanceof Error) {
    return new RCRError(error.message);
  }
  
  error.__proto__ = RCRError.prototype;
  return error;
}

module.exports = {
  normalizeToRCRError,
  RCRType,
  RCRError
};