'use strict';

var path = require('path');
var helpers = require('yeoman-generator').test;

var util = module.exports;


util.makeBase = function makeBase(generator) {
    return {
        gen: generator,
        type: 'swagapi:' + generator,

        args: [],

        dependencies: [
            path.join(__dirname, '..', '..', 'app'),
            path.join(__dirname, '..', '..', 'spec'),
            path.join(__dirname, '..', '..', 'models'),
            path.join(__dirname, '..', '..', 'handlers')
        ],

        options: {
            'skip-install': true
        },

        prompt: {
            'name': 'Foo'
        }
    };
};

util.runGen = function (config, done) {
    helpers.run(path.join(__dirname, '..', '..', config.gen))
        .withOptions(config.options)
        .withArguments(config.args)
        .withPrompts(config.prompt)
        .on('error', done)
        .on('end', done);
};

util.run = function run(config, done) {
    var dir = path.join(__dirname, '..', '..', 'tmp');

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
