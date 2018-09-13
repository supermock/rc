const net = require('net');

const { RCRType, RCRError, normalizeToRCRError } = require('./common');

function RCRServer(options) {
  if (!(this instanceof RCRServer)) return new RCRServer(options);

  this._mods = {};
  this._funcAddr = new Map();
  this._options = options;
  this._server = net.createServer(connection => {
    // console.log('[RCRServer] Client connected to server');
  
    connection.on('data', buffer => {
      const bundle = JSON.parse(buffer.toString('utf8'));

      const action = this._getMethodAndModule(bundle);
      if (action instanceof RCRError) {
        return this._send(connection, this._makeResponse(action));
      }

      const that= this;
      switch(bundle.type) {
        case RCRType.UnrefFunc:
          const i = this._argsHasRCFunction(bundle.args)[0];
          const rcFuncAddr = bundle.args[i];
          if (rcFuncAddr && this._funcAddr.has(rcFuncAddr)) {
            bundle.args[i] = this._funcAddr.get(rcFuncAddr);
          }
        case RCRType.Function:
          const response = this._makeResponse();

          try {
            response.payload.arg = action.method.apply(action.module, bundle.args);
          } catch (error) {
            response.payload.throw = normalizeToRCRError(error);
          }

          if (bundle.type == RCRType.UnrefFunc) {
            this._funcAddr.delete(rcFuncAddr);
          }

          this._send(connection, response);
          break;
        case RCRType.LongLiving:
        case RCRType.Callback:
          try {
            bundle.args = bundle.args.map((arg, i) => {
              if (this._isRCFunction(arg)) {
                const func = function() {
                  that._send(connection, that._makeResponse(null, {
                    index: i,
                    args: Array.from(arguments)
                  }));
                };

                if (bundle.type == RCRType.LongLiving) {
                  this._funcAddr.set(arg, func);
                }

                return func;
              }
              
              return arg;
            });

            action.method.apply(action.module, bundle.args);
          } catch(error) {
            this._send(connection, this._makeResponse(normalizeToRCRError(error)));
          }
          break;
        case RCRType.Promise:
          try {
            action.method.apply(action.module, bundle.args).then(function() {
              that._send(connection, that._makeResponse(null, {
                then: Array.from(arguments),
                catch: null
              }));
            }).catch(function() {
              that._send(connection, that._makeResponse(null, {
                then: null,
                catch: Array.from(arguments).map(arg => arg instanceof Error ? normalizeToRCRError(arg) : arg)
              }));
            });
          } catch(error) {
            this._send(connection, this._makeResponse(normalizeToRCRError(error)));
          }
          break;
        default:
          this._send(connection, this._makeResponse(new RCRError('RCRType nonexistent')));
      }
    })
    .on('error', console.log.bind(console, '[RCRServer] Client error:'))
    .on('end', () => {
      // console.log('[RCRServer] Client disconnected from server');
    });
  }).on('error', err => {
    throw err;
  });
}

RCRServer.prototype._argsHasRCFunction = function(args) {
  return args.matchIndexes('RCRFunction');
}

RCRServer.prototype._isRCFunction = function(arg) {
  return typeof arg == 'string' && arg.indexOf('RCRFunction') > -1;
};

RCRServer.prototype._makeResponse = function(error, payload) {
  return {
    error: error ? error : null,
    payload: payload ? payload: {}
  };
}

RCRServer.prototype._send = function(connection, data) {
  connection.write(Buffer.from(JSON.stringify(data)));
}

RCRServer.prototype._getMethodAndModule = function(bundle) {
  const module = this._mods[bundle.prefix];
  if (!module) {
    return new RCRError(`Module ${bundle.prefix} not registered`);
  }

  const method = module[bundle.signature];
  if (!method) {
    return new RCRError(`Method ${bundle.signature} not found`);
  }

  return {
    module,
    method
  };
}

RCRServer.prototype.registerModule = function(prefix, module) {
  this._mods[prefix] = module;
}

RCRServer.prototype.listen = function() {
  this._server.listen(this._options, () => {
    console.log(`[RCRServer] Listening on ${this._options.port ? this._options.port : this._options.path}`);
  });
}

RCRServer.prototype.close = function(callback) {
  this._server.close(callback);
}

module.exports = RCRServer;