const { RCServer } = require('../');
const options = require('./options');
const child_process = require('child_process');
const Mock = require('./mock');

try {
  const rcs = new RCServer(options);

  rcs.registerModule('child_process', child_process);

  rcs.registerModule('mock', new Mock());

  rcs.listen();
} catch(error) {
  console.log("Failed on start RCServer. %s", error);
}