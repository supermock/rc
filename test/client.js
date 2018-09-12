const { RCClient, RCType } = require('../');
const options = require('./options');

const rcc = new RCClient(options);

const child_process = {
  exec: rcc.call(RCType.Callback, 'child_process.exec', error => console.log('child_process.exec %s', error))
};

child_process.exec('echo "Hello World"', (error, stdout, stderr) => {
  if (error) {
    error.message = `Command failed: echo "Hello World"\n${stderr}`;
    error.__proto__ = Error.prototype;
  }

  console.log('result.error %s', error);
  console.log('result.stdout', stdout);
  console.log('result.stderr', stderr);
});

const Mock = {
  func: rcc.call(RCType.Function, 'mock.func', error => console.log.bind(console, 'mock.func %s', error)),
  callback: rcc.call(RCType.Callback, 'mock.callback', error => console.log('mock.callback %s', error)),
  promise: rcc.call(RCType.Promise, 'mock.promise', error => console.log('mock.promise %s', error)),
  on: rcc.call(RCType.LongLiving, 'mock.on', error => console.log('mock.on %s', error)),
  removeListener: rcc.call(RCType.UnrefFunc, 'mock.removeListener', error => console.log('mock.removeListener %s', error)),
  longLiving: rcc.call(RCType.Function, 'mock.longLiving', error => console.log('mock.longLiving %s', error))
};

Mock.func('Hello World', (error, result) => {
  console.log('RCType.Function.error', error);
  console.log('RCType.Function.result', result);
});

Mock.callback('Hello World', result => {
  console.log('RCType.Callback.result', result);
});

Mock.promise('Hello World', (result) => {
  console.log('RCType.Promise.result', result);
}, error => {
  console.log('RCType.Promise.error', error);
});

let closeLongLiving = null;
const handler = result => {
  console.log('RCType.LongLiving.index', result);

  if (result.indexOf('5') > -1) {
    Mock.removeListener('LongLiving', handler);
    closeLongLiving();
  }
};

closeLongLiving = Mock.on('LongLiving', handler);

Mock.longLiving(error => {
  if (error) {
    Mock.removeListener('LongLiving', handler);
    closeLongLiving();
    console.log('Mock.longLiving %s', error);
  }
});