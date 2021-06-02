/*global test expect jest */
const { createKubik, createApp } = require('rubik-main/tests/helpers/creators');
const { Kubiks } = require('rubik-main');
const http = require('http');

function init(port) {
  const app = createApp();
  const config = createKubik(Kubiks.Config, app);
  config.configs.http = { port };
  createKubik(Kubiks.Log, app);
  return app;
}

const Micro = require('./Micro');

const startPort = 2060;

test('create and up Socket instance', async () => {
  const app = init(startPort);
  const micro = createKubik(Micro, app);
  await app.up();
  expect(micro.server).toBeDefined();
  expect(micro.isSelfStart).toBe(true);
  await micro.stop();
});

test('add and process middlewares', (cb) => {
  const app = init(startPort + 1);
  const micro = createKubik(Micro, app);

  let counter = 0;
  const middleware = jest.fn(() => counter += 1);

  micro.use(async (req, res) => {
    res.end('Hi');
  });
  micro.use({
    middlewares: [middleware, middleware, middleware]
  });
  micro.use(async () => {
    expect(middleware.mock.calls.length).toBe(counter);
    expect(middleware.mock.results[counter - 1].value).toBe(counter);
    await micro.stop();
    setTimeout(() => cb(), 4);
    return false;
  });
  micro.use([() => {
    cb(new Error('Middleware is not skipped 1'));
  }, () => {
    cb(new Error('Middleware is not skipped 2'));
  }]);
  app.up().
    then(() => http.get('http://localhost:' + (startPort + 1)));
});

test('add catcher and catch', (cb) => {
  const app = init(startPort + 2);
  const micro = createKubik(Micro, app);
  const testErr = new Error('I am so testy');
  micro.use({
    async catcher(req, res, err) {
      res.writeHead(500);
      res.end('Bye');
      expect(err).toBe(testErr);
      await micro.stop();
      cb();
    }
  });
  micro.use(() => {
    throw testErr;
  });
  app.up().
    then(() => http.get('http://localhost:' + (startPort + 2)));
});

test('add listener and listen', (cb) => {
  const app = init(startPort + 3);
  const micro = createKubik(Micro, app);
  micro.use({
    async listener(req, res) {
      res.writeHead(200);
      res.end('Bye');
      await micro.stop();
      cb();
    }
  });
  app.up().
    then(() => http.get('http://localhost:' + (startPort + 3)));
});
