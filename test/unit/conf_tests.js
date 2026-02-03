const path = require('path')
const {describe, it, beforeEach} = require('node:test')
const assert = require('node:assert')

const Conf = require('../../index')
const pathToFixtures = path.resolve('test/fixtures')

describe('The Conf', () => {

  describe('constructor', () => {
    it('initializes the passed object', () => {
      const config = new Conf({foo: 'foo'})
      assert.strictEqual(config.get('foo'), 'foo')
    })
  })

  describe('loadEnvironment:', () => {

    it('throws when path is invalid', () => {
      const loadInvalid = () => Conf.loadEnvironment('./invalidpath', 'test')
      assert.throws(loadInvalid, /must be an absolute path/)
    })

    it('throws when environment is undefined', () => {
      const loadUndefinedEnv = () => Conf.loadEnvironment(pathToFixtures)
      assert.throws(loadUndefinedEnv, /env must be set/)
    })

    it('loads a specific environment', () => {
      const config = Conf.loadEnvironment(pathToFixtures, 'staging')
      assert.strictEqual(config.get('environments_staging'), true)
    })

    it('throws MODULE_NOT_FOUND errors if required', () => {
      const loadWithInvalidRequire = () =>
        Conf.loadEnvironment(pathToFixtures, 'with_invalid_require')
      assert.throws(loadWithInvalidRequire, (err) => {
        assert.match(err.message, /Cannot find module/)
        assert.strictEqual(err.code, 'MODULE_NOT_FOUND')
        return true
      })
    })

    it('catches MODULE_NOT_FOUND errors if optional', () => {
      const config = Conf.loadEnvironment(pathToFixtures, 'without_secrets')
      assert.strictEqual(config.get('environments_without_secrets'), true)
    })

    it('throws errors other than MODULE_NOT FOUND if required', () => {
      const loadWithInvalidRequire = () => Conf.loadEnvironment(pathToFixtures, 'with_invalid_code')
      assert.throws(loadWithInvalidRequire, /foobar is not defined/)
    })

    it('throws errors other than MODULE_NOT_FOUND even if not required', () => {
      const loadWithInvalidRequire = () =>
        Conf.loadEnvironment(pathToFixtures, 'with_invalid_secret')
      assert.throws(loadWithInvalidRequire, /foobar is not defined/)
    })

    it('swallows the MODULE_NOT_FOUND error only for the direct require', () => {
      const loadWithInvalidRequire = () =>
        Conf.loadEnvironment(pathToFixtures, 'with_invalid_require_in_secret')
      assert.throws(loadWithInvalidRequire, (err) => {
        assert.match(err.message, /Cannot find module/)
        assert.strictEqual(err.code, 'MODULE_NOT_FOUND')
        return true
      })
    })

    describe('environment values:', () => {

      it('are set to config', () => {
        const config = Conf.loadEnvironment(pathToFixtures, 'test')
        assert.strictEqual(config.get('environment'), 'test')
      })

      it('are nested with the separator __', () => {
        process.env.server__host = 'localhost'

        const config = Conf.loadEnvironment(pathToFixtures, 'test')
        assert.strictEqual(config.get('server:host'), 'localhost')
      })

    })

    describe('with valid path:', () => {

      let config

      beforeEach(() => {
        config = Conf.loadEnvironment(pathToFixtures, 'test')
      })

      it('sets the environment', () => assert.strictEqual(config.get('environment'), 'test'))

      it('loads environments/all', () => assert.strictEqual(config.get('environments_all'), true))

      it('loads environments/test', () => assert.strictEqual(config.get('environments_test'), true))

      it('loads secrets/test', () => assert.strictEqual(config.get('secrets_test'), true))

      it('does not include other environments', () => {
        const getStagingEnvironments = () =>
          config.get('environments_staging')
        assert.throws(getStagingEnvironments, /Failed to get the required configuration for the key/)
      })

    })

  })

  describe('merge:', () => {

    it('overwrites existing', () => {
      const config = new Conf({overwritten: false})

      config.merge({overwritten: true})
      assert.strictEqual(config.get('overwritten'), true)
    })

    it('adds new', () => {
      const config = new Conf()

      config.merge({added: true})
      assert.strictEqual(config.get('added'), true)
    })

    it('merges existing', () => {
      const config = new Conf()

      config.merge({
        environments: {
          all: 'all'
        }
      })
      config.merge({
        environments: {
          test: 'test'
        }
      })
      config.merge({
        secrets: {
          test: 'test'
        }
      })
      assert.deepStrictEqual(config.get('environments'), {
        all: 'all',
        test: 'test'
      })
      assert.deepStrictEqual(config.get('secrets'), {
        test: 'test'
      })

    })

    it('does not touch existing', () => {
      const config = new Conf({existing: true})

      config.merge({added: true})
      assert.strictEqual(config.get('added'), true)
    })

    it('does not merge arrays', () => {
      const config = new Conf({foo: ['foo', 'bar']})

      config.merge({foo: ['quz']})
      assert.deepStrictEqual(config.get('foo'), ['quz'])
    })

    it('merges null', () => {
      const config = new Conf({foo: ['foo', 'bar']})

      config.merge({foo: null})
      assert.deepStrictEqual(config.config.foo, null)
    })

    it('does not merge class instances, keeps the original object', () => {
      class Foo {
        constructor () {
          this.foo = 'foo'
        }
      }

      const config = new Conf({foo: {bar: 'bar'}})

      const foo = new Foo()
      config.merge({foo})
      assert.strictEqual(config.get('foo'), foo)
      assert.strictEqual(foo.bar, undefined)
    })
  })

  describe('set:', () => {

    it('a value', () => {
      const config = new Conf()

      config.set('foo', 'foo')
      assert.strictEqual(config.get('foo'), 'foo')
    })

    it('a nested value', () => {
      const config = new Conf({
        foo: {
          bar: 'foobar'
        }
      })
      assert.strictEqual(config.get('foo:bar'), 'foobar')
    })

  })

  describe('get:', () => {

    it('nested object', () => {
      const config = new Conf({
        foo: {
          bar: 'foobar'
        }
      })
      assert.deepStrictEqual(config.get('foo'), {
        bar: 'foobar'
      })
    })

    it('throws an error on null values?', () => {
      const config = new Conf({test: null})
      const getTest = () => config.get('test')

      assert.throws(getTest)
    })

    it('falls back to default', () => {
      const config = new Conf()
      const val = config.get('foo', 'defaultFoo')

      assert.strictEqual(val, 'defaultFoo')
    })

    it('falls back to default even when default is undefined', () => {
      const config = new Conf()
      const val = config.get('foo', void 0)

      assert.strictEqual(val, void 0)
    })

    it('throws an error when key is undefined', () => {
      const config = new Conf()
      const getUndefinedKey = () => config.get()

      assert.throws(getUndefinedKey, /undefined key/)
    })

  })

  describe('toString:', () => {

    it('creates a json representation of the config', () => {
      const presets = {test: true}
      const config = new Conf(presets)

      assert.strictEqual(config.toString(), '{"test":true}')
    })

  })
})
