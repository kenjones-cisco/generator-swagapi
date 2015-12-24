'use strict';

var path = require('path');
var yeoman = require('yeoman-generator');
var _s = require('underscore.string');
var gulpif = require('gulp-if');
var beautify = require('gulp-beautify');

var debug = require('debuglog')('generator-swagapi');


module.exports = yeoman.Base.extend({
    initializing: {
        init: function () {
            this.argument('name', {
                type: String,
                required: false
            });

            this.option('dry-run', {
                type: Boolean,
                desc: 'Do not make changes just display changes that would have been made',
                defaults: false
            });
            this.option('apiPath', {
                type: String,
                desc: 'Specifiy local path or URL of Swagger API spec'
            });
            this.option('database', {
                type: String,
                desc: 'The database name to use with mongoose'
            });

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
                this.destinationRoot(path.join(oldRoot, this.appname));
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

            this.config.defaults({
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
                when: function () {
                    return !self.config.get('database');
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
        spec: function () {
            this.composeWith('swaggerize:spec', {
                options: this.options,
                arguments: this.args
            }, {
                local: require.resolve('../spec')
            });
        },

        app: function () {

            if (this.options['dry-run']) {
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, '.eslintrc'));
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, '.eslintignore'));
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, '.gitignore'));
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, '.npmignore'));
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, 'package.json'));
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, 'README.md'));
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, 'gulpfile.js'));
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, 'config', 'logger.js'));
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, 'config', 'errors.js'));
                this.log.ok('(DRY-RUN) %s written',
                    path.join(this.appRoot, 'config', 'default.yml'));
                this.log.ok('(DRY-RUN) %s written',
                    path.join(this.appRoot, 'config', 'custom-environment-variables.yml'));
                return;
            }

            debug('generating base application structure');
            this.copy('eslintrc', '.eslintrc');
            this.copy('eslintignore', '.eslintignore');
            this.copy('gitignore', '.gitignore');
            this.copy('npmignore', '.npmignore');

            this.template('_package.json', 'package.json', this.config.getAll());
            this.template('_README.md', 'README.md', {
                slugName: this.config.get('slugName')
            });

            this.copy('_gulpfile.js', 'gulpfile.js');
            this.copy('_logger.js', path.join(this.appRoot, 'config', 'logger.js'));
            this.copy('_errors.js', path.join(this.appRoot, 'config', 'errors.js'));
            this.template('default.yml', path.join(this.appRoot, 'config', 'default.yml'), {
                database: this.config.get('database')
            });
            this.template('custom-environment-variables.yml',
                path.join(this.appRoot, 'config', 'custom-environment-variables.yml'), {
                    database: this.config.get('database')
                });

        },

        database: function () {
            if (!this.config.get('database')) {
                debug('skipping database setup generation');
                return;
            }

            if (this.options['dry-run']) {
                this.log.ok('(DRY-RUN) %s written', path.join(this.appRoot, 'config', 'db.js'));
                return;
            }

            debug('generating database configuration files');
            this.template('_config_db.js', path.join('config', 'db.js'), {
                database: this.config.get('database')
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
