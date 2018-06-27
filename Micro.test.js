/*global test expect */
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

test('add and process middlewares', async (cb) => {
  const app = init(startPort + 1);
  const micro = createKubik(Micro, app);
  micro.use(async (req, res) => {
    res.end('Hi');
  });
  micro.use(async () => {
    await micro.stop();
    setTimeout(() => cb(), 4);
    return false;
  });
  micro.use([() => {
    cb(new Error('Middleware is not skipped 1'));
  }, () => {
    cb(new Error('Middleware is not skipped 2'));
  }]);
  await app.up();
  http.get('http://localhost:' + (startPort + 1));
});

test('add catcher and catch', async (cb) => {
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
  await app.up();
  http.get('http://localhost:' + (startPort + 2));
});

test('add listener and listen', async (cb) => {
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
  await app.up();
  http.get('http://localhost:' + (startPort + 3));
});
