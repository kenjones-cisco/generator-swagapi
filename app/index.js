'use strict';

var path = require('path');
var yeoman = require('yeoman-generator');
var _ = require('lodash');
var _s = require('underscore.string');
var gulpif = require('gulp-if');
var beautify = require('gulp-beautify');
var upath = require('upath');
var helpers = require('../lib/helpers');
var debug = helpers.debug;


module.exports = yeoman.Base.extend({
    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.argument('name', {
            type: String,
            required: false
        });

        this.option('dry-run', {
            type: Boolean,
            desc: 'Do not make changes just display changes that would have been made',
            default: false
        });
        this.option('apiPath', {
            type: String,
            desc: 'Specifiy local path or URL of Swagger API spec'
        });
        this.option('database', {
            type: String,
            desc: 'The database name to use with mongoose'
        });
    },

    initializing: {
        init: function () {
            this.props = {};
            this.log('Swagapi Generator');
        }
    },

    prompting: {
        askAppNameEarly: function () {
            if (this.name) {
                debug('name provided on CLI %s', this.name);
                return;
            }

            var next = this.async();

            // Handle setting the root early, so .yo-rc.json ends up the right place.
            this.prompt([{
                message: 'Project Name',
                name: 'name',
                default: this.appname
            }], function (props) {
                debug('default appname was: %s', this.appname);
                debug('appname provided: %s', props.name);
                this.name = props.name;
                next();
            }.bind(this));
        },

        setAppName: function () {
            var oldRoot = this.destinationRoot();
            debug('oldRoot: %s appName: %s', oldRoot, this.name);
            this.appname = this.name;
            if (path.basename(oldRoot) !== this.appname) {
                this.destinationRoot(upath.joinSafe(oldRoot, this.appname));
                debug('updated destinationRoot to %s', this.destinationRoot());
            }
            this.appRoot = this.destinationRoot();
            debug('Project %s base path %s', this.appname, this.appRoot);
        },

        setDefaults: function () {
            var options = this.options;

            if (options['dry-run']) {
                this.log('Running in dry-run mode');
            }

            this.props = _.defaults(this.props, {
                appname: this.appname,
                slugName: _s.slugify(this.appname),
                apiPath: options.apiPath,
                database: options.database
            });

        },

        askFor: function askFor() {
            var self = this;
            var next = self.async();

            var prompts = [{
                message: 'The database name to use with mongoose',
                name: 'database',
                type: 'input',
                when: !self.props.database
            }];

            self.prompt(prompts, function (answers) {
                debug('prompt results: database =>', answers.database);
                if (helpers.hasValue(answers.database)) {
                    debug('setting value for database');
                    self.props.database = answers.database;
                }
                next();
            });
        }

    },

    writing: {
        genspec: function () {
            this.options.props = this.props;
            this.composeWith('swagapi:spec', {
                options: this.options,
                arguments: this.args
            }, {
                local: require.resolve('../spec')
            });
        },

        app: function () {
            var api;

            if (this.options['dry-run']) {
                this.log.ok('(DRY-RUN) %s written', upath.joinSafe(this.appRoot, '.eslintrc'));
                this.log.ok('(DRY-RUN) %s written', upath.joinSafe(this.appRoot, '.eslintignore'));
                this.log.ok('(DRY-RUN) %s written', upath.joinSafe(this.appRoot, '.gitignore'));
                this.log.ok('(DRY-RUN) %s written', upath.joinSafe(this.appRoot, '.npmignore'));
                this.log.ok('(DRY-RUN) %s written', upath.joinSafe(this.appRoot, 'package.json'));
                this.log.ok('(DRY-RUN) %s written', upath.joinSafe(this.appRoot, 'README.md'));
                this.log.ok('(DRY-RUN) %s written', upath.joinSafe(this.appRoot, 'gulpfile.js'));
                this.log.ok('(DRY-RUN) %s written',
                    upath.joinSafe(this.appRoot, 'config', 'logger.js'));
                this.log.ok('(DRY-RUN) %s written',
                    upath.joinSafe(this.appRoot, 'config', 'errors.js'));
                this.log.ok('(DRY-RUN) %s written',
                    upath.joinSafe(this.appRoot, 'config', 'default.yml'));
                this.log.ok('(DRY-RUN) %s written',
                    upath.joinSafe(this.appRoot, 'config', 'custom-environment-variables.yml'));
                return;
            }

            debug('generating base application structure');
            this.copy('eslintrc', '.eslintrc');
            this.copy('eslintignore', '.eslintignore');
            this.copy('gitignore', '.gitignore');
            this.copy('npmignore', '.npmignore');

            api = helpers.loadApi(this.props.apiPath, this.read(this.props.apiPath));

            this.template('_package.json', 'package.json', {
                slugName: this.props.slugName,
                api: api,
                _s: _s
            });
            this.template('_README.md', 'README.md', {
                api: api
            });

            this.copy('_gulpfile.js', 'gulpfile.js');
            this.copy('_logger.js', upath.joinSafe(this.appRoot, 'config', 'logger.js'));
            this.copy('_errors.js', upath.joinSafe(this.appRoot, 'config', 'errors.js'));
            this.template('default.yml', upath.joinSafe(this.appRoot, 'config', 'default.yml'), {
                database: this.props.database
            });
            this.template('custom-environment-variables.yml',
                upath.joinSafe(this.appRoot, 'config', 'custom-environment-variables.yml'), {
                    database: this.props.database
                });

        },

        database: function () {
            if (!this.props.database) {
                debug('skipping database setup generation');
                return;
            }

            if (this.options['dry-run']) {
                this.log.ok('(DRY-RUN) %s written',
                    upath.joinSafe(this.appRoot, 'config', 'db.js'));
                return;
            }

            debug('generating database configuration files');
            this.template('_config_db.js', upath.joinSafe('config', 'db.js'), {
                database: this.props.database
            });
        },

        finalize: function () {
            // enable beautify of all js files
            var condition = function (file) {
                return path.extname(file.path) === '.js';
            };

            this.registerTransformStream(gulpif(condition, beautify({
                end_with_newline: true
            })));
        }

    },

    install: {
        installNpm: function installNpm() {
            if (this.options['skip-install']) {
                debug('skipping install');
                return;
            }

            /* istanbul ignore if */
            if (!this.options['dry-run']) {
                this.npmInstall([], {
                    '--quiet': true
                });
            } else {
                this.log('(DRY-RUN) install complete');
            }
        }
    }

});
