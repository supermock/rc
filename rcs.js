const net = require('net');

const { RCType, RCError } = require('./common');

function RCServer(options) {
  if (!(this instanceof RCServer)) return new RCServer(options);

  this._mods = {};
  this._funcAddr = new Map();
  this._options = options;
  this._server = net.createServer(connection => {
    // console.log('[RCServer] Client connected to server');
  
    connection.on('data', buffer => {
      const bundle = JSON.parse(buffer.toString('utf8'));

      const action = this._getMethodAndModule(bundle);
      if (action instanceof RCError) {
        return this._send(connection, this._makeResponse(action));
      }

      const that= this;
      switch(bundle.type) {
        case RCType.UnrefFunc:
          const i = this._argsHasRCFunction(bundle.args)[0];
          const rcFuncAddr = bundle.args[i];
          if (rcFuncAddr && this._funcAddr.has(rcFuncAddr)) {
            bundle.args[i] = this._funcAddr.get(rcFuncAddr);
          }
        case RCType.Function:
          const response = this._makeResponse();

          try {
            response.payload.arg = action.method.apply(action.module, bundle.args);
          } catch (error) {
            response.payload.throw = error;
          }

          if (bundle.type == RCType.UnrefFunc) {
            this._funcAddr.delete(rcFuncAddr);
          }

          this._send(connection, response);
          break;
        case RCType.LongLiving:
        case RCType.Callback:
          try {
            bundle.args = bundle.args.map((arg, i) => {
              if (this._isRCFunction(arg)) {
                const func = function() {
                  that._send(connection, that._makeResponse(null, {
                    index: i,
                    args: Array.from(arguments)
                  }));
                };

                if (bundle.type == RCType.LongLiving) {
                  this._funcAddr.set(arg, func);
                }

                return func;
              }
              
              return arg;
            });

            action.method.apply(action.module, bundle.args);
          } catch(error) {
            this._send(connection, this._makeResponse(error));
          }
          break;
        case RCType.Promise:
          try {
            action.method.apply(action.module, bundle.args).then(function() {
              that._send(connection, that._makeResponse(null, {
                then: Array.from(arguments),
                catch: null
              }));
            }).catch(function() {
              that._send(connection, that._makeResponse(null, {
                then: null,
                catch: Array.from(arguments)
              }));
            });
          } catch(error) {
            this._send(connection, this._makeResponse(error));
          }
          break;
        default:
          this._send(connection, this._makeResponse(new RCError('RCType nonexistent')));
      }
    })
    .on('error', console.log.bind(console, '[RCServer] Client error:'))
    .on('end', () => {
      // console.log('[RCServer] Client disconnected from server');
    });
  }).on('error', err => {
    throw err;
  });
}

RCServer.prototype._argsHasRCFunction = function(args) {
  return args.matchIndexes('RCFunction');
}

RCServer.prototype._isRCFunction = function(arg) {
  return arg.indexOf('RCFunction') > -1;
};

RCServer.prototype._makeResponse = function(error, payload) {
  return {
    error: error ? error : null,
    payload: payload ? payload: {}
  };
}

RCServer.prototype._send = function(connection, data) {
  connection.write(Buffer.from(JSON.stringify(data)));
}

RCServer.prototype._getMethodAndModule = function(bundle) {
  const module = this._mods[bundle.prefix];
  if (!module) {
    return new RCError(`Module ${bundle.prefix} not registered`);
  }

  const method = module[bundle.signature];
  if (!method) {
    return new RCError(`Method ${bundle.signature} not found`);
  }

  return {
    module,
    method
  };
}

RCServer.prototype.registerModule = function(prefix, module) {
  this._mods[prefix] = module;
}

RCServer.prototype.listen = function() {
  this._server.listen(this._options, () => {
    console.log(`[RCServer] Listening on ${this._options.port ? this._options.port : this._options.path}`);
  });
}

RCServer.prototype.close = function(callback) {
  this._server.close(callback);
}

module.exports = RCServer;