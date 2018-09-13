const net = require('net');

const { RCRType, RCRError, normalizeToRCRError } = require('./common');
const Essentials = require('./essentials');

function RCRClient(options) {
  if (!(this instanceof RCRClient)) return new RCRClient(options);

  this._options = options;
}

RCRClient.prototype._connect = function() {
  return net.createConnection(this._options);
}

RCRClient.prototype._parseCommand = function(command) {
  const parts = command.split('.');

  if (parts.length != 2) {
    throw new RCRError('Please pass the command in format prefix.signature');
  }

  return {
    prefix: parts[0],
    signature: parts[1]
  };
}

RCRClient.prototype._parseArguments = function(args) {
  return {
    args: args.map(arg => typeof arg == 'function' ? `RCRFunction-${Essentials.encodeB64(arg.name + arg.length)}` : arg)
  };
}

RCRClient.prototype._makeBundle = function(type, command, args) {
  return Object.assign({ type }, this._parseCommand(command), this._parseArguments(args));
}

RCRClient.prototype._parsePayload = function(buffer) {
  const response = JSON.parse(buffer.toString('utf8'));
  if (response.error) {
    throw normalizeToRCRError(response.error);
  }

  if (response.payload.throw) {
    response.payload.throw = normalizeToRCRError(response.payload.throw);
  }

  return response.payload;
}

/**
 * @param {RCRType}
 * @param {String}
 * @description
 *  rcc.call(RCRType.Function, 'Module.method', param1, param2, ..., (arg1, arg2, ...) => {})
 *  rcc.call(RCRType.Callback, 'Module.method', param1, param2, ..., (arg1, arg2, ...) => {})
 *  rcc.call(RCRType.Promise, 'Module.method', param1, param2, ..., (arg1, arg2, ...) => {//then}, (arg1, arg2, ...) => {//catch})
 *  const stop = rcc.call(RCRType.LongLiving, 'Module.method', param1, param2, ..., (arg1, arg2, ...) => {}); stop();
**/
RCRClient.prototype.call = function(type, command, errorCallback) {
  return function() {
    try {
      const args = Array.prototype.slice.call(arguments);
      const bundle = this._makeBundle(type, command, args);

      switch(type) {
        case RCRType.UnrefFunc:
        case RCRType.Function:
          if (typeof args[args.length - 1] != 'function') throw new RCRError(`RCRType.${RCRType.name(bundle.type)} the last argument is a function`);
          break;
        case RCRType.Callback:
        case RCRType.LongLiving:
          if (bundle.args.matchIndexes('RCRFunction').length == 0) throw new RCRError(`RCRType.${RCRType.name(bundle.type)} have one callback in parameters`);
          break;
        case RCRType.Promise:
          if (typeof args[args.length - 1] != 'function' || typeof args[args.length - 2] != 'function') throw new RCRError('RCRType.Promise have two callbacks in parameters (then(), catch())');
          break;
        default:
          throw new RCRError('RCRType nonexistent');
      }

      const client = this._connect();

      const dataHandler = buffer => {
        try {
          const payload = this._parsePayload(buffer);

          switch(type) {
            case RCRType.UnrefFunc:
              client.end();
              break;
            case RCRType.Function:
              args[args.length - 1].call(null, payload.throw, payload.arg);
              client.end();
              break;
            case RCRType.Callback:
              args[payload.index].apply(null, payload.args);
              client.end();
              break;
            case RCRType.Promise:
              if (payload.then) {
                args[args.length - 2].apply(null, payload.then);
              } else {
                args[args.length - 1].apply(null, payload.catch);
              }
              client.end();
              break;
            case RCRType.LongLiving:
              args[payload.index].apply(null, payload.args);
              break;
          }
        } catch(error) {
          client.emit('error', error);
          client.end();
        }
      };

      client.on('connect', () => {
        client.write(Buffer.from(JSON.stringify(bundle)));
      }).on('error', error => {
        errorCallback(normalizeToRCRError(error));
      });

      if (type == RCRType.LongLiving) {
        client.on('data', dataHandler);
        return client.end.bind(client);
      } else {
        client.once('data', dataHandler);
      }
    } catch(error) {
      errorCallback(normalizeToRCRError(error));
    }
  }.bind(this);
}

module.exports = RCRClient;