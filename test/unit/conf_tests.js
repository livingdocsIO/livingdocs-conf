const path = require('path')
const chai = require('chai')
const expect = chai.expect

const Conf = require('../../index')
const pathToFixtures = path.resolve('test/fixtures')

describe('The Conf', () => {

  describe('constructor', () => {
    return it('initializes the passed object', () => {
      const config = new Conf({foo: 'foo'})
      return expect(config.get('foo')).to.eql('foo')
    })
  })

  describe('loadEnvironment:', () => {

    it('throws when path is invalid', () => {
      const loadInvalid = () => Conf.loadEnvironment('./invalidpath', 'test')
      return expect(loadInvalid).to["throw"]('must be an absolute path')
    })

    it('throws when environment is undefined', () => {
      const loadUndefinedEnv = () => Conf.loadEnvironment(pathToFixtures)
      return expect(loadUndefinedEnv).to["throw"]('env must be set')
    })

    it('loads a specific environment', () => {
      const config = Conf.loadEnvironment(pathToFixtures, 'staging')
      return expect(config.get('environments_staging')).to.be.true
    })

    it('throw other MODULE_NOT_FOUND errors', () => {
      const loadWithInvalidRequire = () => Conf.loadEnvironment(pathToFixtures, 'with-invalid-require')
      return expect(loadWithInvalidRequire).to["throw"](/Cannot find module/)
    })

    describe('environment values:', () => {

      it('are set to config', () => {
        const config = Conf.loadEnvironment(pathToFixtures, 'test')
        return expect(config.get('environment')).to.eql('test')
      })

      it('are nested with the separator __', () => {
        let config

        process.env.server__host = 'localhost'

        config = Conf.loadEnvironment(pathToFixtures, 'test')
        return expect(config.get('server:host')).to.eql('localhost')
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
        const getStagingEnvironments = () => config.get('environments_staging')
        return expect(getStagingEnvironments).to["throw"]('Failed to get the required configuration for the key')
      })

    })

  })

  describe('merge:', () => {

    it('overwrites existing', () => {
      const config = new Conf({overwritten: false})
      config.merge({overwritten: true})
      return expect(config.get('overwritten')).to.be.true
    })

    it('adds new', function() {
      const config = new Conf()
      config.merge({added: true})
      return expect(config.get('added')).to.be.true
    })

    it('merges existing', function() {
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
      return expect(config.get('secrets')).to.deep.equal({
        test: 'test'
      })

    })

    it('does not touch existing', function() {
      const config = new Conf({existing: true})
      config.merge({added: true})
      return expect(config.get('added')).to.be.true
    })

  })

  describe('set:', () => {

    it('a value', () => {
      const config = new Conf()
      config.set('foo', 'foo')
      return expect(config.get('foo')).to.eql('foo')
    })

    it('a nested value', () => {
      const config = new Conf({
        foo: {
          bar: 'foobar'
        }
      })
      return expect(config.get('foo:bar')).to.eql('foobar')
    })

  })

  describe('get:', () => {

    it('nested object', () => {
      const config = new Conf({
        foo: {
          bar: 'foobar'
        }
      })
      return expect(config.get('foo')).to.deep.eql({
        bar: 'foobar'
      })
    })

    it('falls back to default', () => {
      const config = new Conf()
      const val = config.get('foo', 'defaultFoo')
      return expect(val).to.eql('defaultFoo')
    })

    it('falls back to default even when default is undefined', () => {
      const config = new Conf()
      const val = config.get('foo', void 0)
      return expect(val).to.eql(void 0)
    })

    it('throws an error when key is undefined', () => {
      const config = new Conf()
      const getUndefinedKey = () => config.get()

      return expect(getUndefinedKey).to["throw"]('undefined key')
    })
  })
})