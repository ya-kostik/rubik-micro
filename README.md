# rubik-micro
Micro server kubik for the Rubik

## Install

### npm
```bash
npm i micro
npm i rubik-micro
```

### yarn
```bash
yarn add micro
yarn add rubik-micro
```

## Use
```javascript
const { App, Kubiks } = require('rubik-main');
const Micro = require('rubik-micro');
const path = require('path');

// create rubik app
const app = new App();
// config need for most modules
const config = new Kubiks.Config(path.join(__dirname, './config/'));
// you can use any logger you want, just create kubik with it
// default Kubiks.Log use console for logging
const log = new Kubiks.Log();

const micro = new Micro();
// use is extension method for Kubik instances
micro.use(async function(req, res/*,  micro */) {
  res.end('Ok, it is done');
});
// You can use any middlewares you want. If you want to stop process middlewares, just `return false` from middleware.

app.add([ config, log, http ]);

app.up().
then(() => console.info('App started')).
catch(err => console.error(err));
```

## Config
`http.js` config in configs volume should contain port, you can specify bind too.

For example:
`config/http.js`
```javascript
module.exports = {
  // http will create http server and will listen 1993 port
  port: 1993,
  bind: 'localhost'
};
```

## Extensions
When you add an instance of Micro to app, you can use standart extensions interface,
with other extensions
```javascript
app.use({
  config: {
    volumes: [
      path.join(__dirname, './config'),
      path.join(__dirname, '../config')
    ]
  },
  http: [
    require('./whitelist.js'),
    require('./cacheControl.js')
  ]
});
```

Also you can use `use` directly
```javascript
http.use([
  require('./whitelist.js'),
  require('./cacheControl.js')
]);
```

Micro's instance has the following extensions
1. function — just add as middleware

```javascript
app.use({
  http: function(req, res, micro) {
    console.info('Request starts at', new Date());
    return true;
  }
});

http.use(async function(req, res) {
  const users = await User.findAll();
  res.json({ list: users });
  console.info('Request ends at', new Date());
});
```
2. Array of functions — add more then one middlewares

```javascript
app.use({
  http: [
    require('./parseBody.js'),
    require('./whitelist.js')
  ]
});

http.use([
  require('./cacheControl.js'),
  require('./ruleControl.js')
]);
```
3. Add custom catcher or listener

```javascript
app.use({
  http: {
    catcher: (req, res, err) => {
      console.error(err);
      res.end('Internal server Error');
    }
  }
});

http.use({
  listener: (req, res) => {
    res.end('200 is Ok');
  }
});
```
4. before and after hooks

```javascript
app.use({
  http: {
    before(micro) {
      // before apply any middleware
    },
    after(micro) {
      // after apply all middlewares, but before create server and listen
    }
  }
})
```

5. middlewares and other extensions with one object

```javascript
app.use({
  http: {
    middlewares: [
      require('./parseBody.js'),
      require('./whitelist.js')
    ],
    listener: (req, res) => {
      res.end('200 is Ok');
    },
    catcher: (req, res, err) => {
      console.error(err);
      res.end('Internal server Error');
    },
    before(micro) {
      // before apply any middleware
    },
    after(micro) {
      // after apply all middlewares, but before create server and listen
    }
  }
});
```

6. Array composition of extensions

```javascript
app.use({
  http: [
    require('./parseBody.js'),
    require('./whitelist.js'),
    require('./cacheControl.js'),
    require('./ruleControl.js'),
    {
      listener: (req, res) => res.end('200 is Ok')
    },
    {
      catcher: (req, res, err) => {
        console.error(err);
        res.end('Internal server Error');
      }
    },
    {
      before(micro) {
        // before apply any middleware
      },
      after(micro) {
        // after apply all middlewares, but before create server and listen
      }
    }
  ]
});
```
