const path = require('path')
const assert = require('assert')
const pointer = require('jsonpointer')
const _ = require('lodash')

module.exports = class Conf {

  constructor (obj = {}) {
    this.config = obj
  }

  static loadEnvironment (configDir, env) {
    assert(env, 'env must be set')
    assert(path.isAbsolute(configDir), 'configDir must be an absolute path')
    const conf = new Conf()

    conf.merge(loadFile(configDir, 'environments/', 'all', {required: true}))
    conf.merge(loadFile(configDir, 'environments', env, {required: true}))
    conf.merge(loadFile(configDir, 'secrets', env, {required: false}))
    conf.merge(getEnvVariables())
    conf.set('environment', env)
    return conf
  }

  set (key, value) {
    pointer.set(this.config, strToPointer(key), value)
  }

  get (key, defaultValue) {
    assert(key, 'Cannot lookup undefined key in configuration')

    const val = pointer.get(this.config, strToPointer(key))
    if (val != null) return val
    else if (arguments.length === 2) return defaultValue
    throw new Error(
      `Failed to get the required configuration for the key '${key}'
       You might want to add that key in your config file.`
    )
  }

  merge (obj) {
    return _.merge(this.config, obj)
  }

  toString () {
    return JSON.stringify(this.config)
  }
}

function loadFile () {
  const parts = _.take(arguments, arguments.length - 1)
  const opts = arguments[arguments.length - 1]
  const required = opts.required
  const p = path.join.apply(path, parts)

  try {
    return require(p)
  } catch (e) {
    if (!(e.code === 'MODULE_NOT_FOUND' && e.message.startsWith(`Cannot find module '${p}'`))) {
      throw e
    }
    if (opts.required) throw e
  }
}

function getEnvVariables () {
  return _.reduce(process.env, function (obj, val, key) {
    const k = key.split('__').join('/')
    pointer.set(obj, strToPointer(k), val)
    return obj
  }, {})
}

function strToPointer (str) {
  return `/${str.replace(/:/g, '/')}`
}
