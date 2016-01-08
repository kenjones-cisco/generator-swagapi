'use strict';

var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');
var _ = require('lodash');
var _s = require('underscore.string');
var mkdirp = require('mkdirp');
var pluralize = require('pluralize');
var upath = require('upath');
var specutil = require('../lib/specutil');
var helpers = require('../lib/helpers');
var debug = helpers.debug;

var METHODS = require('swagger-methods');


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
        handlers: function () {
            var routes, self;

            self = this;

            if (!self.options['dry-run']) {
                mkdirp.sync(upath.joinSafe(self.appRoot, 'handlers'));
            }

            routes = self._formatRoutes(self.api.paths);

            _.forEach(_.values(routes), function (route) {

                var file = upath.joinSafe(
                    self.appRoot,
                    upath.addExt(helpers.prefix(route.handler, 'handlers/'), '.js'));

                route.dbmodels = self._getDbModels(route, path.dirname(file));

                if (!self.options['dry-run']) {
                    // provides access to lodash within the template
                    route._ = _;
                    route.helpers = specutil;
                    debug('generating handler %s', file);
                    self.template('_handler.js', file, route);
                } else {
                    self.log.ok('(DRY-RUN) handler %s generated', file);
                }

            });
        },

        tests: function () {
            if (!this.options['dry-run']) {
                mkdirp.sync(upath.joinSafe(this.appRoot, 'tests'));
            }

            var self = this;
            var operations = self._formatRoutes(self.api.paths);

            _.forEach(_.values(operations), function (operation) {

                var file = upath.joinSafe(
                    self.appRoot,
                    'tests',
                    upath.addExt(helpers.prefix(
                        helpers.unprefix(operation.handler, 'handlers/'), 'test_'), '.js'));

                if (!self.options['dry-run']) {
                    debug('generating handler test %s', file);
                    self.template('_test.js', file, {
                        _: _,
                        util: util,
                        specutil: specutil,
                        resourcePath: self.api.basePath,
                        operations: operation,
                        models: self.api.definitions
                    });
                } else {
                    self.log.ok('(DRY-RUN) test %s generated', file);
                }

            });
        }
    },

    _formatRoutes: function formatRoutes(apiPaths) {
        var routes = {};

        _.forEach(apiPaths, function (def, apipath) {
            var route = {
                path: apipath,
                pathname: undefined,
                methods: [],
                handler: undefined
            };

            route.pathname = specutil.normalizeURL(apipath);
            // if handler specified within specification then use that path
            // else default to the route path.
            route.handler = def['x-handler'] || route.pathname;

            _.forEach(def, function (operation, verb) {
                // skip operations associated to invalid methods
                if (!_.contains(METHODS, verb)) {
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

            // this handles the scenario where the path is essentially
            // the same like:
            //  '/pets' ===  '/pets/'
            if (routes[route.pathname]) {
                routes[route.pathname].methods.push.apply(
                    routes[route.pathname].methods, route.methods);
                return;
            }

            routes[route.pathname] = route;
        });

        return routes;
    },

    _getDbModels: function getDbModels(route, relPath) {
        var self = this;
        var dbModels = [];
        var schemas, dbFileName;

        if (!self.config.get('database') && !this.options.database) {
            return null;
        }

        function handleDbFile(name) {
            dbFileName = upath.addExt(
                upath.joinSafe(self.appRoot, 'models', name.toLowerCase()), '.js');
            if (self.fs.exists(dbFileName)) {
                debug('handler dbmodel rel path: %s', upath.removeExt(
                    upath.toUnix(path.relative(relPath, dbFileName)), '.js'));
                if (!_.any(dbModels, {name: _s.classify(name)})) {
                    dbModels.push({
                        name: _s.classify(name),
                        path: upath.removeExt(
                            upath.toUnix(path.relative(relPath, dbFileName)), '.js')
                    });
                }
            }
        }

        schemas = specutil.getRespSchema(route);
        if (!_.isEmpty(schemas)) {
            _.forEach(schemas, function (schema) {
                handleDbFile(schema);
            });
        }

        route.path.split('/').forEach(function (element) {
            if (element) {
                handleDbFile(pluralize.singular(element));
            }
        });

        debug(dbModels);
        return dbModels;
    }

});
