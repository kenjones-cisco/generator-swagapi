'use strict';

var path = require('path');
var yeoman = require('yeoman-generator');
var _ = require('lodash');
var _s = require('underscore.string');
var mkdirp = require('mkdirp');
var builderUtils = require('swaggerize-routes/lib/utils');
var pluralize = require('pluralize');

var debug = require('util').debuglog('generator-swagapi');


module.exports = yeoman.Base.extend({
    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.argument('name', {
            type: String,
            required: true
        });
        this.appRoot = this.destinationRoot();
        this.api = this.options.api;
    },

    writing: {
        handlers: function() {
            var routes, self;

            self = this;
            routes = {};

            if (!self.options['dry-run']) {
                mkdirp.sync(path.join(self.appRoot, 'handlers'));
            }

            _.forEach(this.api.paths, function(def, apipath) {
                var pathnames, route;

                route = {
                    path: apipath,
                    pathname: undefined,
                    methods: [],
                    handler: undefined
                };

                pathnames = [];

                apipath.split('/').forEach(function(element) {
                    if (element) {
                        pathnames.push(element);
                    }
                });

                route.pathname = pathnames.join('/');
                // if handler specified within specification then use that path
                // else default to the route path.
                route.handler = def['x-handler'] || route.pathname;

                _.forEach(builderUtils.verbs, function(verb) {
                    var operation = def[verb];

                    if (!operation) {
                        return;
                    }

                    route.methods.push({
                        method: verb,
                        name: operation.operationId || '',
                        description: operation.description || '',
                        parameters: operation.parameters || [],
                        responses: operation.responses
                    });

                });

                if (routes[route.pathname]) {
                    routes[route.pathname].methods.push.apply(
                        routes[route.pathname].methods, route.methods);
                    return;
                }

                routes[route.pathname] = route;
            });

            Object.keys(routes).forEach(function(routePath) {
                var handlername, route, file;

                route = routes[routePath];
                handlername = route.handler;
                handlername = builderUtils.prefix(handlername, 'handlers/');
                handlername = builderUtils.suffix(handlername, '.js');

                file = path.join(self.appRoot, handlername);

                // provides access to lodash within the template
                route._ = _;
                route.dbmodels = self._getDbModels(route);
                if (!self.options['dry-run']) {
                    self.template('_handler' + '.js', file, route);
                } else {
                    self.log.ok('(DRY-RUN) handler %s generated', file);
                }
            });
        },

        tests: function() {
            var self, api, models, resourcePath, modelsPath;

            if (!this.options['dry-run']) {
                mkdirp.sync(path.join(this.appRoot, 'tests'));
            }

            self = this;
            api = this.api;
            models = {};

            modelsPath = path.join(self.appRoot, 'models');

            if (api.definitions && modelsPath) {

                _.forEach(api.definitions, function(modelSchema, key) {
                    var options = {};

                    if (!modelSchema.properties) {
                        debug('model has no properties: %s', key);
                        return;
                    }

                    Object.keys(modelSchema.properties).forEach(function(prop) {
                        var defaultValue;

                        switch (modelSchema.properties[prop].type) {
                            case 'integer':
                            case 'number':
                            case 'byte':
                                defaultValue = 1;
                                break;
                            case 'string':
                                defaultValue = 'helloworld';
                                break;
                            case 'boolean':
                                defaultValue = true;
                                break;
                            default:
                                break;
                        }

                        if (modelSchema.required && !!~modelSchema.required.indexOf(prop)) {
                            options[prop] = defaultValue;
                        }
                    });

                    models[key] = options;
                });

            }
            resourcePath = api.basePath;

            _.forEach(api.paths, function(def, opath) {
                var file, fileName, operations;

                operations = [];

                _.forEach(builderUtils.verbs, function(verb) {
                    var operation = {};

                    if (!def[verb]) {
                        return;
                    }

                    _.forEach(def[verb], function(op, key) {
                        operation[key] = op;
                    });

                    operation.path = opath;
                    operation.method = verb;

                    operations.push(operation);
                });

                fileName = 'test' + opath.replace(/\//g, '_') + '.js';
                if (def['x-handler']) {
                    fileName = def['x-handler'];
                    fileName = 'test_' + builderUtils.unprefix(fileName, 'handlers/');
                    fileName = builderUtils.suffix(fileName, '.js');
                }
                file = path.join(self.appRoot, 'tests', fileName);

                if (!self.options['dry-run']) {
                    debug('generating handler test %s', file);
                    self.template('_test.js', file, {
                        _: _,
                        resourcePath: resourcePath,
                        operations: operations,
                        models: models
                    });
                } else {
                    self.log.ok('(DRY-RUN) test %s generated', file);
                }

            });
        }
    },

    _getDbModels: function getDbModels(route) {
        var self = this;
        var dbModels = [];
        var relPath = path.join(self.appRoot, 'handlers');
        var single, dbFileName, className;

        if (!self.config.get('database')) {
            return null;
        }

        route.path.split('/').forEach(function(element) {
            if (element) {
                single = pluralize.singular(element);
                debug('element: %s single: %s', element, single);
                dbFileName = path.join(self.appRoot, 'models', single + '.js');
                if (self.fs.exists(dbFileName)) {
                    className = _s.classify(single);
                    dbModels.push({
                        name: className,
                        path: builderUtils.unsuffix(path.relative(relPath, dbFileName), '.js')
                    });
                }
            }
        });
        debug(dbModels);
        return dbModels;
    }

});
