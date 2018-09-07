const net = require('net');

const { RCType, RCError } = require('./common');

function RCClient(options) {
  if (!(this instanceof RCClient)) return new RCClient(options);

  this._options = options;
}

RCClient.prototype._connect = function() {
  return net.createConnection(this._options);
}

RCClient.prototype._parseCommand = function(command) {
  const parts = command.split('.');

  if (parts.length != 2) {
    throw new RCError('Por favor passe o comando no formato prefixo.assinatura');
  }

  return {
    prefix: parts[0],
    signature: parts[1]
  };
}

RCClient.prototype._parseArguments = function(args) {
  return {
    args: args.map(arg => typeof arg == 'function' ? 'RCFunction' : arg)
  };
}

RCClient.prototype._makeBundle = function(type, command, args) {
  return Object.assign({ type }, this._parseCommand(command), this._parseArguments(args));
}

RCClient.prototype._parsePayload = function(buffer) {
  const response = JSON.parse(buffer.toString('utf8'));
  if (response.error) {
    response.error.__proto__ = RCError.prototype;
    throw response.error;
  }
  return response.payload;
}

/**
 * @param {RCType}
 * @param {String}
 * @description
 *  rcc.call(RCType.Function, 'Module.method', param1, param2, ..., (arg1, arg2, ...) => {})
 *  rcc.call(RCType.Callback, 'Module.method', param1, param2, ..., (arg1, arg2, ...) => {})
 *  rcc.call(RCType.Promise, 'Module.method', param1, param2, ..., (arg1, arg2, ...) => {//then}, (arg1, arg2, ...) => {//catch})
 *  const stop = rcc.call(RCType.LongLiving, 'Module.method', param1, param2, ..., (arg1, arg2, ...) => {}); stop();
**/
RCClient.prototype.call = function(type, command) {
  const args = Array.prototype.slice.call(arguments, 2);
  const bundle = this._makeBundle(type, command, args);

  switch(type) {
    case RCType.Function:
      if (typeof args[args.length - 1] != 'function') throw new RCError('RCType.Function the last argument is a function');
      break;
    case RCType.Callback:
      if (bundle.args.indexOf('RCFunction') == -1) throw new RCError('RCType.Callback have one callback in parameters');
      break;
    case RCType.Promise:
      if (typeof args[args.length - 1] != 'function' || typeof args[args.length - 2] != 'function') throw new RCError('RCType.Promise have two callbacks in parameters (then(), catch())');
      break;
    case RCType.LongLiving:
      if (bundle.args.indexOf('RCFunction') == -1) throw new RCError('RCType.LongLiving have one callback in parameters');
      break;
    default:
      throw new RCError('RCType nonexistent');
  }

  const client = this._connect();

  const dataHandler = buffer => {
    const payload = this._parsePayload(buffer);

    switch(type) {
      case RCType.Function:
        args[args.length - 1].call(null, payload.throw, payload.arg);
        client.end();
        break;
      case RCType.Callback:
        args[payload.index].apply(null, payload.args);
        client.end();
        break;
      case RCType.Promise:
        if (payload.then) {
          args[args.length - 2].apply(null, payload.then);
        } else {
          args[args.length - 1].apply(null, payload.catch);
        }
        client.end();
        break;
      case RCType.LongLiving:
        args[payload.index].apply(null, payload.args);
        break;
    }
  };

  client.on('connect', () => {
    client.write(Buffer.from(JSON.stringify(bundle)));
  }).on('error', error => {
    throw error;
  });

  if (type == RCType.LongLiving) {
    client.on('data', dataHandler);
    return client.end.bind(client);
  } else {
    client.once('data', dataHandler);
  }
}

module.exports = RCClient;