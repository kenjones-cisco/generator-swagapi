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
        this.props = this.options.props;
    },

    prompting: {
        askFor: function askFor() {
            var self = this;
            var next = self.async();

            var prompts = [{
                message: 'Path (or URL) to swagger document',
                name: 'apiPath',
                type: 'input',
                when: !self.props.apiPath
            }];

            self.prompt(prompts, function (answers) {
                debug('prompt results: apiPath =>', answers.apiPath);
                if (helpers.hasValue(answers.apiPath)) {
                    debug('setting value for apiPath');
                    self.props.apiPath = answers.apiPath;
                }
                next();
            });
        },

        checkPath: function () {
            debug('apiPath is: %s', this.props.apiPath);
            if (!this.props.apiPath) {
                this.env.error(new Error('missing required input `apiPath`'));
            }
        }

    },

    configuring: {
        copyLocal: function () {
            var apiSrc, apiSrcPath, apiDestPath, apiPath;

            apiSrcPath = helpers.findFile(this.props.apiPath, this.env.cwd, this.appRoot);
            if (!apiSrcPath) {
                this.env.error(new Error('invalid required input `apiPath`'));
            }

            if (helpers.isRemote(apiSrcPath)) {
                debug('apiPath is URL: %s', apiSrcPath);
                return;
            }

            apiDestPath = this._prepareDest();
            apiSrc = path.resolve(apiSrcPath);
            apiPath = upath.joinSafe(apiDestPath, path.basename(apiSrc));

            this.copy(apiSrc, apiPath);
            this.props.apiPath = apiPath;

        },

        copyRemote: function () {
            var apiSrc, apiSrcPath, apiDestPath, apiPath, done, self;

            apiSrcPath = this.props.apiPath;

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
                self.props.apiPath = apiPath;
                done(err);
            });

        },

        validateSpec: function () {
            var self, done;

            self = this;
            self.props.api = helpers.loadApi(self.props.apiPath,
                self.read(self.props.apiPath));

            done = self.async();
            enjoi(apischema).validate(self.props.api, function (error, value) {
                debug('validateSpec error:', error);
                done(error);
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
                path.relative(this.appRoot, this.props.apiPath)));
            this.template('_server.js', 'server.js', {
                apiPath: upath.normalizeSafe(
                    path.relative(this.appRoot, this.props.apiPath)),
                database: this.props.database
            });
        },

        genmodels: function () {
            this.options.props = this.props;
            this.composeWith('swagapi:models', {
                options: this.options,
                arguments: this.args
            }, {
                local: require.resolve('../models')
            });
        },

        genhandlers: function () {
            this.options.props = this.props;
            this.composeWith('swagapi:handlers', {
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
