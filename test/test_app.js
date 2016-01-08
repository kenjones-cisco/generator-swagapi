'use strict';

var path = require('path');
var assert = require('yeoman-assert');
var testutil = require('./util');


describe('swaggerize:app', function () {

    it('scaffolds dot files', function (done) {
        var base = testutil.makeBase('app');

        base.options.apiPath = path.join(__dirname, 'fixtures/pets.json');

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                '.eslintrc',
                '.eslintignore',
                '.gitignore',
                '.npmignore'
            ]);

            done();
        });
    });

    it('scaffolds base project files', function (done) {
        var base = testutil.makeBase('app');

        base.options.apiPath = path.join(__dirname, 'fixtures/pets.json');

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                'gulpfile.js',
                'README.md',
                'package.json',
                'config/logger.js',
                'config/errors.js',
                'config/default.yml',
                'config/custom-environment-variables.yml'
            ]);

            done();
        });
    });

    it('takes the name from the command line arguments', function (done) {
        var base = testutil.makeBase('app');

        base.args = ['MyApp'];
        base.options.apiPath = path.join(__dirname, 'fixtures/pets.json');

        delete base.prompt.name;

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.jsonFileContent('package.json', {
                name: 'myapp'
            });

            done();
        });
    });

    it('prompt the user for api path', function (done) {
        var base = testutil.makeBase('app');

        base.prompt.apiPath = path.join(__dirname, 'fixtures/pets.json');

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            // update check to make sure it exists in 'config/pets.json'
            assert.jsonFileContent('package.json', {
                name: 'foo'
            });

            done();
        });
    });

    it('scaffolds base project files with database option', function (done) {
        var base = testutil.makeBase('app');

        base.options.apiPath = path.join(__dirname, 'fixtures/pets.json');
        base.options.database = 'test';

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                '.eslintrc',
                '.eslintignore',
                '.gitignore',
                '.npmignore',
                'gulpfile.js',
                'README.md',
                'package.json',
                'config/logger.js',
                'config/errors.js',
                'config/default.yml',
                'config/custom-environment-variables.yml',
                'config/db.js'
            ]);

            done();
        });
    });

    it('scaffolds base project files with database prompt', function (done) {
        var base = testutil.makeBase('app');

        base.options.apiPath = path.join(__dirname, 'fixtures/pets.json');
        base.prompt.database = 'test';

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.file([
                '.eslintrc',
                '.eslintignore',
                '.gitignore',
                '.npmignore',
                'gulpfile.js',
                'README.md',
                'package.json',
                'config/logger.js',
                'config/errors.js',
                'config/default.yml',
                'config/custom-environment-variables.yml',
                'config/db.js'
            ]);

            done();
        });
    });

    it('dry-run - scaffolds base project files', function (done) {
        var base = testutil.makeBase('app');

        base.options.apiPath = path.join(__dirname, 'fixtures/pets.json');
        base.options['dry-run'] = true;
        base.options['skip-install'] = false;

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.noFile([
                '.eslintrc',
                '.eslintignore',
                '.gitignore',
                '.npmignore',
                'gulpfile.js',
                'README.md',
                'package.json',
                'config/logger.js',
                'config/errors.js',
                'config/default.yml',
                'config/custom-environment-variables.yml'
            ]);

            done();
        });
    });

    it('dry-run - scaffolds base project files with database', function (done) {
        var base = testutil.makeBase('app');

        base.options.apiPath = path.join(__dirname, 'fixtures/pets.json');
        base.options.database = 'test';
        base.options['dry-run'] = true;

        testutil.run(base, function (err) {
            if (err) {
                return done.fail(err);
            }
            assert.noFile([
                '.eslintrc',
                '.eslintignore',
                '.gitignore',
                '.npmignore',
                'gulpfile.js',
                'README.md',
                'package.json',
                'config/logger.js',
                'config/errors.js',
                'config/default.yml',
                'config/custom-environment-variables.yml',
                'config/db.js'
            ]);

            done();
        });
    });

});

// the use of helpers testDirectory results in changing
// the cwd into a temp directory. So that other gulp commands
// can be in the correct location, go back to the project root.
afterAll(function () {
    process.chdir(path.join(__dirname, '..'));
});
