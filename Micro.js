const micro = require('micro');
const { Kubik } = require('rubik-main');

// Checkers
const isFunction = fn => typeof fn === 'function';
const isString = str => typeof str === 'string';

/**
 * Micro kubik for Rubik
 * Use micro server for process http
 * @namespace Rubik
 * @class Micro
 * @prop {String}   name of kubik, default is "http"
 */
class Micro extends Kubik {
  constructor() {
    super(...arguments);
    this.middlewares = [];
    this.listener = this.defaultListener.bind(this);
    this.catcher = this.defaultCatcher.bind(this);
    this.server = null;
    this.isSelfStart = false;
  }

  /**
   * up kubik
   * @param  {Object}       dependencies of kubik
   * @param  {Rubik.Config} dependencies.config
   * @param  {Rubik.Log}    dependencies.log
   * @return {Promise}
   */
  async up({ config, log }) {
    this.config = config;
    this.log = log;
    this.options = this.config.get('http');
    await this.applyHooks('before');
    for (const extension of this.extensions) {
      if (Array.isArray(extension)) {
        for (const innerExtension of extension) {
          this.apply(innerExtension);
        }
        continue;
      }
      this.apply(extension);
    }
    this.server = micro(this.listener);
  }

  /**
   * apply extension
   * @param  {Function|Object} extension is a middleware function, or event object: { String event, Function listener }
   * @return {Rubik.SocketIO}            this
   */
  apply(extension) {
    if (isFunction(extension)) {
      this.middlewares.push(extension);
      return this;
    }
    if (extension.listener) {
      this.listen(extension.listener);
    }
    if (extension.catcher) {
      this.catch(extension.catcher);
    }
    if (Array.isArray(extension.middlewares)) {
      this.middlewares = this.middlewares.concat(extension.middlewares);
    }
  }

  async processMiddlewares(req, res) {
    for (const middleware of this.middlewares) {
      const result = await middleware(req, res, this);
      if (!(result || result === undefined)) return;
    }
  }

  /**
   * default Listener
   * @param  {http.Request}  req
   * @param  {http.Response} res
   */
  async defaultListener(req, res) {
    try {
      await this.processMiddlewares(req, res);
    } catch (err) {
      this.catcher(req, res, err, this);
    }
  }

  /**
   * default Catcher
   * @param  {http.Request}  req
   * @param  {http.Response} res
   * @param  {Error} err
   */
  defaultCatcher(req, res, err) {
    this.log.error('Micro HTTP Error', err);
    res.writeHead(500);
    res.end('Internal server error');
  }

  /**
   * add listener function, it calls when request come
   * @param  {Function} listener
   * @return {Rubik.Micro} this
   */
  listen(listener) {
    if (!isFunction(listener)) throw new TypeError('listener is not a function');
    this.listener = listener;
  }

  /**
   * add catcher function
   * @param  {Function} catcher
   * @return {Rubik.Micro} this
   */
  catch(catcher) {
    if (!isFunction(catcher)) throw new TypeError('catcher is not a function');
    this.catcher = catcher;
    return this;
  }

  /**
   * start micro Server
   * @param  {Number}  port to listen
   * @param  {String}  bind address
   * @return {Promise}
   */
  async start(port, bind) {
    return new Promise((resolve, reject) => {
      this.server.listen(port, bind, (err, res) => {
        if (err) return reject(err);
        this.isSelfStart = true;
        return resolve(res);
      });
    });
  }

  /**
   * stop micro Server, if it was started from this.start();
   * @return {Promise}
   */
  async stop() {
    if (!this.isSelfStart) return;
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) return reject(err);
        return resolve();
      });
    });
  }

  /**
   * after all kubiks up hook
   */
  async after() {
    await this.applyHooks('after');
    const port = +this.options.port;
    let bind = this.options.bind;
    if (!(bind && isString(bind))) bind = 'localhost';
    await this.start(port, bind);
    this.log.info(`Micro server started at ${bind}:${port} 🚀`);
  }
}

Micro.prototype.name = 'http';
Micro.prototype.dependencies = Object.freeze(['config', 'log']);

module.exports = Micro;
