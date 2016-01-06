/*eslint no-unused-vars: [2, {"args": "after-used", "argsIgnorePattern": "^value$"}]*/
'use strict';

var path = require('path');
var os = require('os');
var url = require('url');
var apischema = require('swagger-schema-official/schema');
var enjoi = require('enjoi');
var mkdirp = require('mkdirp');
var upath = require('upath');
var yeoman = require('yeoman-generator');
var helpers = require('../lib/helpers');
var debug = helpers.debug;


module.exports = yeoman.Base.extend({
    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.argument('name', {
            type: String,
            required: true
        });
        this.appRoot = this.destinationRoot();
    },

    prompting: {
        askFor: function askFor() {
            var self = this;
            var next = self.async();

            var prompts = [{
                message: 'Path (or URL) to swagger document',
                name: 'apiPath',
                type: 'input',
                when: function () {
                    return !self.config.get('apiPath');
                }
            }];

            self.prompt(prompts, function (answers) {
                for (var key in answers) {
                    debug('prompt results: %s =>', key, answers[key]);
                    if (typeof answers[key] !== 'undefined' && answers[key] !== null) {
                        debug('setting key value: %s', key);
                        self.config.set(key, answers[key]);
                    }
                }

                self.config.save();
                next();
            });
        }
    },

    configuring: {
        copyLocal: function () {
            var apiSrc, apiSrcPath, apiDestPath, apiPath;

            apiSrcPath = helpers.findFile(this.config.get('apiPath'), this.env.cwd, this.appRoot);
            if (!apiSrcPath) {
                this.env.error(new Error('missing or invalid required input `apiPath`'));
            }

            if (helpers.isRemote(apiSrcPath)) {
                debug('apiPath is URL: %s', apiSrcPath);
                return;
            }

            apiDestPath = this._prepareDest();
            apiSrc = path.resolve(apiSrcPath);
            apiPath = upath.joinSafe(apiDestPath, path.basename(apiSrc));

            this.copy(apiSrc, apiPath);
            this.config.set('apiPath', apiPath);

        },

        copyRemote: function () {
            var apiSrc, apiSrcPath, apiDestPath, apiPath, done, self;

            apiSrcPath = this.config.get('apiPath');

            if (!helpers.isRemote(apiSrcPath)) {
                debug('apiPath is file: %s', apiSrcPath);
                return;
            }

            self = this;
            done = self.async();

            apiDestPath = this._prepareDest();
            apiSrc = url.parse(apiSrcPath).pathname;
            apiPath = upath.joinSafe(apiDestPath, path.basename(apiSrc));

            self.fetch(apiSrcPath, apiDestPath, function (err) {
                if (err) {
                    self.env.error(err);
                }
                self.config.set('apiPath', apiPath);
                done();
            });

        },

        validateSpec: function () {
            var self, done;

            self = this;
            self.api = helpers.loadApi(self.config.get('apiPath'),
                self.read(self.config.get('apiPath')));

            done = self.async();
            enjoi(apischema).validate(self.api, function (error, value) {
                if (error) {
                    self.env.error(error);
                }
                done();
            });
        }

    },

    writing: {
        server: function () {

            if (this.options['dry-run']) {
                this.log.ok('(DRY-RUN) %s written', upath.joinSafe(this.appRoot, 'server.js'));
                return;
            }

            debug('server apiPath: %s', upath.normalizeSafe(
                path.relative(this.appRoot, this.config.get('apiPath'))));
            this.template('_server.js', 'server.js', {
                apiPath: upath.normalizeSafe(
                    path.relative(this.appRoot, this.config.get('apiPath'))),
                database: this.config.get('database')
            });
        },

        genmodels: function () {
            this.options.api = this.api;
            this.composeWith('swaggerize:models', {
                options: this.options,
                arguments: this.args
            }, {
                local: require.resolve('../models')
            });
        },

        genhandlers: function () {
            this.options.api = this.api;
            this.composeWith('swaggerize:handlers', {
                options: this.options,
                arguments: this.args
            }, {
                local: require.resolve('../handlers')
            });
        }
    },

    _prepareDest: function () {
        var apiDestPath = this.destinationPath('config');
        if (this.options['dry-run']) {
            apiDestPath = upath.joinSafe(os.tmpdir(), 'config');
            this.log('(DRY-RUN) using temp location %s', apiDestPath);
        }
        mkdirp.sync(apiDestPath);

        return apiDestPath;
    }

});
