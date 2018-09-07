const { RCClient, RCType } = require('../');
const options = require('./options');

try {
  const rcc = new RCClient(options);

  rcc.call(RCType.Callback, 'child_process.exec', 'echo "Hello World"', (error, stdout, stderr) => {
    if (error) {
      error.message = `Command failed: echo "Hello World"\n${stderr}`;
      error.__proto__ = Error.prototype;
    }

    console.log('result.error %s', error);
    console.log('result.stdout', stdout);
    console.log('result.stderr', stderr);
  });

  rcc.call(RCType.Function, 'mock.func', 'Hello World', 'Coxinha', (error, result) => {
    console.log('RCType.Function.error', error);
    console.log('RCType.Function.result', result);
  });

  rcc.call(RCType.Callback, 'mock.callback', 'Hello World', (result) => {
    console.log('RCType.Callback.result', result);
  });

  rcc.call(RCType.Promise, 'mock.promise', 'Hello World', (result) => {
    console.log('RCType.Promise.result', result);
  }, error => {
    console.log('RCType.Promise.error', error);
  });

  const closeLongLiving = rcc.call(RCType.LongLiving, 'mock.longLiving', 'Hello World', result => {
    console.log('RCType.LongLiving.index', result);

    if (result.indexOf('5') > -1) closeLongLiving();
  });
} catch(err) {
  console.log('ERROR: %s', err);
}