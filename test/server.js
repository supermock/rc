const { RCRServer } = require('../');
const options = require('./options');
const child_process = require('child_process');
const Mock = require('./mock');

try {
  const rcrs = new RCRServer(options);

  rcrs.registerModule('child_process', child_process);

  rcrs.registerModule('mock', new Mock());

  rcrs.listen();
} catch(error) {
  console.log("Failed on start RCRServer. %s", error);
}