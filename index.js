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

    conf.merge(loadFile([configDir, 'environments/all'], {required: true}))
    conf.merge(loadFile([configDir, 'environments', env], {required: true}))
    conf.merge(loadFile([configDir, 'secrets', env], {required: false}))
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
    return _.mergeWith(this.config, obj, (configValue, overrideValue) => {
      // Do not apply merge on non-plain objects
      if (typeof overrideValue === 'object' && overrideValue.constructor !== Object) {
        return overrideValue
      }

      // Do not apply merge on arrays
      if (Array.isArray(overrideValue)) {
        return overrideValue
      }
    })
  }

  toString () {
    return JSON.stringify(this.config)
  }
}

function loadFile (parts, opts) {
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
  const env = {}
  for (const key of Object.keys(process.env)) {
    const k = key.split('__').join('/')
    pointer.set(env, strToPointer(k), process.env[key])
  }
  return env
}

function strToPointer (str) {
  return `/${str.replace(/:/g, '/')}`
}
