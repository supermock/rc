const { RCRClient, RCRType } = require('../');
const options = require('./options');

const rcrc = new RCRClient(options);

const child_process = {
  exec: rcrc.call(RCRType.Callback, 'child_process.exec', error => console.log('child_process.exec %s', error))
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
  func: rcrc.call(RCRType.Function, 'mock.func', error => console.log.bind(console, 'mock.func %s', error)),
  callback: rcrc.call(RCRType.Callback, 'mock.callback', error => console.log('mock.callback %s', error)),
  promise: rcrc.call(RCRType.Promise, 'mock.promise', error => console.log('mock.promise %s', error)),
  on: rcrc.call(RCRType.LongLiving, 'mock.on', error => console.log('mock.on %s', error)),
  removeListener: rcrc.call(RCRType.UnrefFunc, 'mock.removeListener', error => console.log('mock.removeListener %s', error)),
  longLiving: rcrc.call(RCRType.Function, 'mock.longLiving', error => console.log('mock.longLiving %s', error))
};

Mock.func('Hello World', (error, result) => {
  console.log('RCRType.Function.error', error);
  console.log('RCRType.Function.result', result);
});

Mock.callback('Hello World', result => {
  console.log('RCRType.Callback.result', result);
});

Mock.promise('Hello World', (result) => {
  console.log('RCRType.Promise.result', result);
}, error => {
  console.log('RCRType.Promise.error', error);
});

let closeLongLiving = null;
const handler = result => {
  console.log('RCRType.LongLiving.index', result);

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