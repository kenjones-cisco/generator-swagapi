'use strict';

var path = require('path');
var yeoman = require('yeoman-generator');
var _ = require('lodash');
var _s = require('underscore.string');
var mkdirp = require('mkdirp');
var methods = require('swagger-methods');
var pluralize = require('pluralize');
var upath = require('upath');

var debug = require('util').debuglog('generator-swagapi');

function prefix(str, pre) {
    str = str || '';
    if (str.indexOf(pre) === 0) {
        return str;
    }

    str = pre + str;
    return str;
}

function unprefix(str, pre) {
    str = str || '';
    if (str.indexOf(pre) === 0) {
        str = str.substr(pre.length);
        return str;
    }

    return str;
}


module.exports = yeoman.Base.extend({
    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.argument('name', {
            type: String,
            required: true
        });
        this.appRoot = this.destinationRoot();
      this.api = this.options.api;
      this.schemas = Object.keys(this.api.definitions);
    },

    writing: {
        handlers: function () {
            var routes, self;

            self = this;
            routes = {};

            if (!self.options['dry-run']) {
                mkdirp.sync(upath.joinSafe(self.appRoot, 'handlers'));
            }

            _.forEach(this.api.paths, function (def, apipath) {
                var pathnames, route;

                route = {
                    path: apipath,
                    pathname: undefined,
                    methods: [],
                    handler: undefined
                };

                pathnames = [];

                apipath.split('/').forEach(function (element) {
                    if (element) {
                        pathnames.push(element);
                    }
                });

                route.pathname = pathnames.join('/');
                // if handler specified within specification then use that path
                // else default to the route path.
                route.handler = def['x-handler'] || route.pathname;

                _.forEach(methods, function (verb) {
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

            Object.keys(routes).forEach(function (routePath) {
                var handlername, route, file;

                route = routes[routePath];
                handlername = route.handler;
                handlername = prefix(handlername, 'handlers/');
                handlername = upath.addExt(handlername, '.js');

                file = upath.joinSafe(self.appRoot, handlername);

                // provides access to lodash within the template
                route._ = _;
              route.dbmodels = self._getDbModels(route).map(function(model) {
                model.path = upath.removeExt(upath.toUnix(path.relative(path.dirname(file), model.modelPath)), '.js');
                return model;
              });

                if (!self.options['dry-run']) {
                    self.template('_handler.js', file, route);
                } else {
                    self.log.ok('(DRY-RUN) handler %s generated', file);
                }
            });
        },

        tests: function () {
            var self, api, models, resourcePath, modelsPath;

            if (!this.options['dry-run']) {
                mkdirp.sync(upath.joinSafe(this.appRoot, 'tests'));
            }

            self = this;
            api = this.api;
            models = {};

            modelsPath = upath.joinSafe(self.appRoot, 'models');

            if (api.definitions && modelsPath) {

                _.forEach(api.definitions, function (modelSchema, key) {
                    var options = {};

                    if (!modelSchema.properties) {
                        debug('model has no properties: %s', key);
                        return;
                    }

                    Object.keys(modelSchema.properties).forEach(function (prop) {
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

            _.forEach(api.paths, function (def, opath) {
                var file, fileName, operations;

                operations = [];

                _.forEach(methods, function (verb) {
                    var operation = {};

                    if (!def[verb]) {
                        return;
                    }

                    _.forEach(def[verb], function (op, key) {
                        operation[key] = op;
                    });

                    operation.path = opath;
                    operation.method = verb;

                    operations.push(operation);
                });

                fileName = 'test' + opath.replace(/\//g, '_') + '.js';
                if (def['x-handler']) {
                    fileName = def['x-handler'];
                    fileName = 'test_' + unprefix(fileName, 'handlers/');
                    fileName = upath.addExt(fileName, '.js');
                }
                file = upath.joinSafe(self.appRoot, 'tests', fileName);

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
        var relPath = upath.joinSafe(self.appRoot, 'handlers');
        var single, dbFileName, className;

        if (!self.config.get('database')) {
            return null;
        }
      var results = route.methods.map(function(x) {
        return x.responses['200'];
      }).filter(function(x) {
        return x.hasOwnProperty('schema');
      });
      var schemas = results.map(function(x) {
        return x.schema['$ref'];
      }).concat(
        results.filter(function(x) {
          return x.schema.type === 'array';
        }).map(function(x) {
          return x.schema.items['$ref']
        })
      ).filter(function(x) {
        return x != undefined;
      }).map(function(x) {
        return x.substring(x.lastIndexOf('/') + 1);
      });
      dbModels = _.intersection(schemas, self.schemas).map(function(name) {
        var dbfileName = upath.addExt(upath.joinSafe(self.appRoot, 'models', name), '.js');
        return {
          name: _s.classify(name),
          modelPath: dbfileName,
          path: upath.removeExt(upath.toUnix(path.relative(relPath, dbfileName)), '.js')
        }
      });
      debug(dbModels);
      return dbModels;
    }

});
