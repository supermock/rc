const { RCServer } = require('../');
const options = require('./options');
const child_process = require('child_process');

try {
  const rcs = new RCServer(options);

  rcs.registerModule('child_process', child_process);

  rcs.registerModule('mock', {
    _ret(text) {
      return text + ' - OK!';
    },
    func(text) {
      return this._ret(text);
    },
    callback(text, callback) {
      callback(this._ret(text));
    },
    promise(text) {
      return new Promise(resolve => resolve(this._ret(text)));
    },
    longLiving(text, callback) {
      let i = 0;
      let message = this._ret(text);
      let id = setInterval(() => {
        if (i == 5) clearInterval(id);
        callback(`${message} (${i++})`);
      }, 1000);
    }
  });

  rcs.listen();
} catch(error) {
  console.log("Failed on start RCServer. %s", error);
}