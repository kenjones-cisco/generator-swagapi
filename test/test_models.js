'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('yeoman-assert');
var testutil = require('./util');
var jsYaml = require('js-yaml');


describe('swaggerize:models', function () {

    it('generate models from spec', function (done) {
        var base = testutil.makeBase('models');

        base.args = ['foo'];
        base.options.api = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/pets.json')));

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                'models/pet.js',
                'models/error.js'
            ]);

            done();
        });
    });

    it('generate models from spec with parent-child', function (done) {
        var base = testutil.makeBase('models');

        base.args = ['foo'];
        base.options.api = jsYaml.safeLoad(
            fs.readFileSync(path.join(__dirname, 'fixtures/pets.yaml')));

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                'models/pet.js',
                'models/error.js',
                'models/cat.js'
            ]);

            done();
        });
    });

});
