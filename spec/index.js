/*eslint no-unused-vars: [2, {"args": "after-used", "argsIgnorePattern": "^value$"}]*/
'use strict';

var fs = require('fs');
var path = require('path');
var os = require('os');
var url = require('url');
var _s = require('underscore.string');
var apischema = require('swagger-schema-official/schema');
var enjoi = require('enjoi');
var jsYaml = require('js-yaml');
var mkdirp = require('mkdirp');
var yeoman = require('yeoman-generator');

var debug = require('debuglog')('generator-swagapi');


function fileExists(file) {
    var exists = true;

    try {
        fs.statSync(file);
    } catch (err) {
        exists = false;
    }
    return exists;
}

function findFile(name, root, project) {
    var location;
    debug('name: %s root: %s project: %s', name, root, project);

    if (!name) {
        return name;
    }

    location = path.resolve(root, name);
    debug('resolve to root: %s', location);
    if (fileExists(location)) {
        return location;
    }

    location = path.resolve(project, name);
    debug('resolve to project: %s', location);
    if (fileExists(location)) {
        return location;
    }
    debug('using default: %s', name);
    return name;
}

function isRemote(apiPath) {
    return apiPath && apiPath.indexOf('http') === 0;
}

function isYaml(file) {
    if (_s.endsWith(file, '.yaml') || _s.endsWith(file, '.yml')) {
        return true;
    }
    return false;
}

function loadApi(apiPath, content) {
    if (isYaml(apiPath)) {
        debug('loading api using yaml');
        return jsYaml.safeLoad(content);
    }
    debug('loading api using json');
    return JSON.parse(content);
}


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

    writing: {
        copyLocal: function () {
            var apiSrc, apiSrcPath, apiDestPath, apiPath;

            apiSrcPath = findFile(this.config.get('apiPath'), this.env.cwd, this.appRoot);
            if (!apiSrcPath) {
                this.env.error(new Error('missing or invalid required input `apiPath`'));
            }

            if (isRemote(apiSrcPath)) {
                debug('apiPath is URL: %s', apiSrcPath);
                return;
            }

            apiDestPath = this._prepareDest();
            apiSrc = path.resolve(apiSrcPath);
            apiPath = path.join(apiDestPath, path.basename(apiSrc));

            this.copy(apiSrc, apiPath);
            this.config.set('apiPath', apiPath);

        },

        copyRemote: function () {
            var apiSrc, apiSrcPath, apiDestPath, apiPath, done, self;

            apiSrcPath = this.config.get('apiPath');

            if (!isRemote(apiSrcPath)) {
                debug('apiPath is file: %s', apiSrcPath);
                return;
            }

            self = this;
            done = self.async();

            apiDestPath = this._prepareDest();
            apiSrc = url.parse(apiSrcPath).pathname;
            apiPath = path.join(apiDestPath, path.basename(apiSrc));

            self.fetch(apiSrcPath, apiDestPath, function (err) {
                if (err) {
                    this.env.error(err);
                }
                self.config.set('apiPath', apiPath);
                done();
            });

        },

        validateSpec: function () {
            var self, done;

            self = this;
            self.api = loadApi(self.config.get('apiPath'), self.read(self.config.get('apiPath')));

            done = self.async();
            enjoi(apischema).validate(self.api, function (error, value) {
                if (error) {
                    this.env.error(error);
                }
                done();
            });
        },

        server: function () {

            if (this.options['dry-run']) {
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, 'server.js'));
                return;
            }

            this.template('_server.js', 'server.js', {
                apiPath: path.relative(this.appRoot, this.config.get('apiPath')),
                database: this.config.get('database')
            });
        },

        models: function () {
            this.options.api = this.api;
            this.composeWith('swaggerize:models', {
                options: this.options,
                arguments: this.args
            }, {
                local: require.resolve('../models')
            });
        },

        handlers: function () {
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
            apiDestPath = path.join(os.tmpdir(), 'config');
            this.log('(DRY-RUN) using temp location %s', apiDestPath);
        }
        mkdirp.sync(apiDestPath);

        return apiDestPath;
    }

});
