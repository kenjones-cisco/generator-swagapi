'use strict';

var path = require('path');
var assert = require('yeoman-assert');
var testutil = require('./util');


describe('swaggerize:spec', function () {

    it('copy local json', function (done) {
        var base = testutil.makeBase('spec');

        base.args = ['foo'];
        base.prompt.apiPath = path.join(__dirname, 'fixtures/pets.json');

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                'config/pets.json',
                'server.js'
            ]);
            done();
        });
    });

    it('copy local yaml', function (done) {
        var base = testutil.makeBase('spec');

        base.args = ['foo'];
        base.prompt.apiPath = path.join(__dirname, 'fixtures/pets.yaml');

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                'config/pets.yaml',
                'server.js'
            ]);
            done();
        });
    });

    it('copy remote json', function (done) {
        var base = testutil.makeBase('spec');

        base.args = ['foo'];
        /* eslint-disable */
        base.prompt.apiPath = 'https://raw.githubusercontent.com/wordnik/swagger-spec/master/examples/v2.0/json/petstore.json';
        /* eslint-enable */

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                'config/petstore.json',
                'server.js'
            ]);
            done();
        });
    });

    it('bad api file', function (done) {
        var base = testutil.makeBase('spec');

        base.args = ['foo'];
        base.prompt.apiPath = path.join(__dirname, 'fixtures/badapi.json');

        testutil.runGen(base, function (err) {
            if (err) {
                expect(err.name).toBe('ValidationError');
            }
            done();
        });

    });

    it('missing api file', function (done) {
        var base = testutil.makeBase('spec');

        base.args = ['foo'];
        base.prompt.apiPath = null;

        testutil.runGen(base, function (err) {
            if (err) {
                expect(err.message).toMatch(/missing or invalid required input/);
            }
            done();
        });
    });

});
