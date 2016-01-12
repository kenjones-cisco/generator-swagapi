'use strict';

var path = require('path');
var helpers = require('yeoman-test');

var util = module.exports;

var BASE_DIR = path.join(__dirname, '..', '..');

util.makeBase = function makeBase(generator) {
    return {
        gen: generator,
        type: 'swagapi:' + generator,

        args: [],

        dependencies: [
            path.join(BASE_DIR, 'app'),
            path.join(BASE_DIR, 'spec'),
            path.join(BASE_DIR, 'models'),
            path.join(BASE_DIR, 'handlers')
        ],

        options: {
            'skip-install': true,
            'props': {}
        },

        prompt: {
            'name': 'Foo'
        }
    };
};

util.runGen = function (config, done) {
    this.errorCalled = false;

    function error(err) {
        if (this.errorCalled) {
            return;
        }
        this.errorCalled = true;
        done(err);
    }

    function end(err) {
        if (this.errorCalled) {
            return;
        }
        this.errorCalled = true;
        done(err);
    }

    helpers.run(path.join(BASE_DIR, config.gen))
        .withOptions(config.options)
        .withArguments(config.args)
        .withPrompts(config.prompt)
        .on('error', error)
        .on('end', end);
};

util.run = function run(config, done) {
    var dir = path.join(BASE_DIR, 'tmp');

    helpers.testDirectory(dir, function (err) {
        if (err) {
            return done(err);
        }

        var app = helpers.createGenerator(
            config.type, config.dependencies, config.args, config.options);
        helpers.mockPrompt(app, config.prompt);

        app.run(function (error) {
            if (error) {
                return done(error);
            }
            done();
        });
    });

};
