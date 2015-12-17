'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('yeoman-assert');
var testutil = require('./util');
var jsYaml = require('js-yaml');


describe('swaggerize:handlers', function () {

    it('generate handlers and tests from spec', function (done) {
        var base = testutil.makeBase('handlers');

        base.args = ['foo'];
        base.options.api = jsYaml.safeLoad(
            fs.readFileSync(path.join(__dirname, 'fixtures/pets.yaml')));

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                'handlers/pets.js',
                'handlers/petsByID.js',
                'tests/test_pets.js',
                'tests/test_petsByID.js'
            ]);

            done();
        });
    });

});
