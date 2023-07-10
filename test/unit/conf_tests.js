const path = require('path')
const chai = require('chai')
const expect = chai.expect

const Conf = require('../../index')
const pathToFixtures = path.resolve('test/fixtures')

describe('The Conf', () => {

  describe('constructor', () => {
    it('initializes the passed object', () => {
      const config = new Conf({foo: 'foo'})
      expect(config.get('foo')).to.eql('foo')
    })
  })

  describe('loadEnvironment:', () => {

    it('throws when path is invalid', () => {
      const loadInvalid = () => Conf.loadEnvironment('./invalidpath', 'test')
      expect(loadInvalid).to.throw('must be an absolute path')
    })

    it('throws when environment is undefined', () => {
      const loadUndefinedEnv = () => Conf.loadEnvironment(pathToFixtures)
      expect(loadUndefinedEnv).to.throw('env must be set')
    })

    it('loads a specific environment', () => {
      const config = Conf.loadEnvironment(pathToFixtures, 'staging')
      expect(config.get('environments_staging')).to.be.true
    })

    it('throws MODULE_NOT_FOUND errors if required', () => {
      const loadWithInvalidRequire = () =>
        Conf.loadEnvironment(pathToFixtures, 'with_invalid_require')
      expect(loadWithInvalidRequire).to.throw('Cannot find module')
        .with.property('code', 'MODULE_NOT_FOUND')
    })

    it('catches MODULE_NOT_FOUND errors if optional', () => {
      const config = Conf.loadEnvironment(pathToFixtures, 'without_secrets')
      expect(config.get('environments_without_secrets')).to.be.true
    })

    it('throws errors other than MODULE_NOT FOUND if required', () => {
      const loadWithInvalidRequire = () => Conf.loadEnvironment(pathToFixtures, 'with_invalid_code')
      expect(loadWithInvalidRequire).to.throw('foobar is not defined')
    })

    it('throws errors other than MODULE_NOT_FOUND even if not required', () => {
      const loadWithInvalidRequire = () =>
        Conf.loadEnvironment(pathToFixtures, 'with_invalid_secret')
      expect(loadWithInvalidRequire).to.throw('foobar is not defined')
    })

    it('swallows the MODULE_NOT_FOUND error only for the direct require', () => {
      const loadWithInvalidRequire = () =>
        Conf.loadEnvironment(pathToFixtures, 'with_invalid_require_in_secret')
      expect(loadWithInvalidRequire).to.throw('Cannot find module')
        .with.property('code', 'MODULE_NOT_FOUND')
    })

    describe('environment values:', () => {

      it('are set to config', () => {
        const config = Conf.loadEnvironment(pathToFixtures, 'test')
        expect(config.get('environment')).to.eql('test')
      })

      it('are nested with the separator __', () => {
        process.env.server__host = 'localhost'

        const config = Conf.loadEnvironment(pathToFixtures, 'test')
        expect(config.get('server:host')).to.eql('localhost')
      })

    })

    return describe('with valid path:', () => {

      let config

      beforeEach(() => {
        config = Conf.loadEnvironment(pathToFixtures, 'test')
      })

      it('sets the environment', () => expect(config.get('environment')).to.eql('test'))

      it('loads environments/all', () => expect(config.get('environments_all')).to.be.true)

      it('loads environments/test', () => expect(config.get('environments_test')).to.be.true)

      it('loads secrets/test', () => expect(config.get('secrets_test')).to.be.true)

      it('does not include other environments', () => {
        const getStagingEnvironments = () =>
          config.get('environments_staging')
        expect(getStagingEnvironments)
          .to.throw('Failed to get the required configuration for the key')
      })

    })

  })

  describe('merge:', () => {

    it('overwrites existing', () => {
      const config = new Conf({overwritten: false})

      config.merge({overwritten: true})
      expect(config.get('overwritten')).to.be.true
    })

    it('adds new', function () {
      const config = new Conf()

      config.merge({added: true})
      expect(config.get('added')).to.be.true
    })

    it('merges existing', function () {
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
      expect(config.get('environments')).to.deep.equal({
        all: 'all',
        test: 'test'
      })
      expect(config.get('secrets')).to.deep.equal({
        test: 'test'
      })

    })

    it('does not touch existing', function () {
      const config = new Conf({existing: true})

      config.merge({added: true})
      expect(config.get('added')).to.be.true
    })

    it('does not merge arrays', function () {
      const config = new Conf({foo: ['foo', 'bar']})

      config.merge({foo: ['quz']})
      expect(config.get('foo')).to.deep.equal(['quz'])
    })

    it('does not merge class instances, keeps the original object', function () {
      class Foo {
        constructor () {
          this.foo = 'foo'
        }
      }

      const config = new Conf({foo: {bar: 'bar'}})

      const foo = new Foo()
      config.merge({foo})
      expect(config.get('foo')).to.equal(foo)
      expect(foo.bar).to.equal(undefined)
    })
  })

  describe('set:', () => {

    it('a value', () => {
      const config = new Conf()

      config.set('foo', 'foo')
      expect(config.get('foo')).to.eql('foo')
    })

    it('a nested value', () => {
      const config = new Conf({
        foo: {
          bar: 'foobar'
        }
      })
      expect(config.get('foo:bar')).to.eql('foobar')
    })

  })

  describe('get:', () => {

    it('nested object', () => {
      const config = new Conf({
        foo: {
          bar: 'foobar'
        }
      })
      expect(config.get('foo')).to.deep.eql({
        bar: 'foobar'
      })
    })

    it('throws an error on null values?', () => {
      const config = new Conf({test: null})
      const getTest = () => config.get('test')

      expect(getTest).to.throw
    })

    it('falls back to default', () => {
      const config = new Conf()
      const val = config.get('foo', 'defaultFoo')

      expect(val).to.eql('defaultFoo')
    })

    it('falls back to default even when default is undefined', () => {
      const config = new Conf()
      const val = config.get('foo', void 0)

      expect(val).to.eql(void 0)
    })

    it('throws an error when key is undefined', () => {
      const config = new Conf()
      const getUndefinedKey = () => config.get()

      expect(getUndefinedKey).to.throw('undefined key')
    })

  })

  describe('toString:', () => {

    it('creates a json representation of the config', () => {
      const presets = {test: true}
      const config = new Conf(presets)

      expect(config.toString()).to.equal('{"test":true}')
    })

  })
})
