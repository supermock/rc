# Remote Caller Rays

Remote Caller Rays is a simple project in the form of client and server, that you can make available methods that will be executed on the server and returned to the client on another host for example. Much like an RPC.

# Installation

```sh
$ npm i --save rcr
```

# How to use?

### Server definition

```js
const { RCRServer } = require('rcr');
const child_process = require('child_process');

try {
  const rcrs = new RCRServer({
    port: 40000
  });

  rcrs.registerModule('child_process', child_process);

  rcrs.listen();
} catch(error) {
  console.log("Failed on start RCRServer. %s", error);
}
```

### Client definition

```js
const { RCRClient, RCRType } = require('rcr');

const rcrc = new RCRClient({
  port: 40000
});

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
```

## Read in another language
[Clique aqui e leia em português](https://github.com/supermock/rcr/blob/master/README-PT-BR.md)

## Contributions
Just download the code make your change and send a pull request explaining the purpose if it is a bug or an improvement and etc ... After this will be analyzed to be approved. Note: If it is a major change, open a issue explaining what will be done so you do not waste your precious time developing something that will not be used. Make yourself at home!

## License

MIT