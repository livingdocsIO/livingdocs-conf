# @livingdocs/conf

Package to load, merge and access environment-specific configuration files.

#### How to use

Example how to load the configuration for an environment defined in an
environment variable:

```js
const path = require('path')
const Conf = require('@livingdocs/conf')

const appConf = Conf.loadEnvironment(path.resolve('./conf'), process.env.ENVIRONMENT)
```

#### Required folder structure

This modules assumes a specific folder structure. Following is an example:
```
yourConfigFolder/
  environments/
    all.js
    local.js
    staging.js
    production.js
  secrets/
    local.js
```

To load a e.g the 'local' environment use `loadEnvironment(path.resolve('./yourConfigFolder'), 'local')`.

This will go through the following steps:

1. load environments/all.js
2. merge environments/local.js
3. merge secrets/local.js
4. merge environment variables

The environment names `local`, `staging`, `production` are not defined. You can
use whatever you want there.


#### Environment variables

Example all.js:
```js
db: {
  database: 'foo'
}
```

You can override the `database` property as follows:
```bash
exports db__database=bar
```

Double underscores (`__`) denote a child property.


#### API

The `loadEnvironment` method is the main entry point to init a configuration.
```js
const appConf = Conf.loadEnvironment(file, environment)
```

Get a config value. Note: this will throw an error if the config is not present.
```js
appConf.get('db:database')
```

To safely query for a config value provide a default value as the second param.
```js
appConf.get('db:database', null)
```

You can also set config values programmatically:
```js
appConf.set('db:database', 'bar')
```

You can manually merge whole objects to set configs in bulk:
```js
appConf.merge(obj)
```

Outputs the whole configuration as json string:
```js
appConf.toString(obj)
```


## Copyright
Copyright (c) 2015 Livingdocs AG, all rights reserved

It is not permitted to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this Software, except when explicitly stated otherwise by Livingdocs AG.
