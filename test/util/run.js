'use strict';

var path = require('path');
var helpers = require('yeoman-generator').test;


/**
 * Runs a generator
 */
module.exports = function run(config, done) {
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
