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
  LongLiving: 4 //on()
};

function RCError(message) {
  this.message = message;
  this.__proto__ = Error.prototype;
}

module.exports = {
  RCType,
  RCError
};