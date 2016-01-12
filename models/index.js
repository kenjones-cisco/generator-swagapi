'use strict';

var yeoman = require('yeoman-generator');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var upath = require('upath');
var specutil = require('../lib/specutil');
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

    writing: {
        models: function() {
            var self = this;
            var models = {};
            var basePath = upath.joinSafe(self.appRoot, 'models');

            if (!self.options['dry-run']) {
                mkdirp.sync(basePath);
            }

            if (self.props.database) {
                if (!self.options['dry-run']) {
                    self.copy('_models_index.js',
                        upath.joinSafe(self.appRoot, 'models', 'index.js'));
                } else {
                    self.log.ok('(DRY-RUN) (db) models index generated');
                }
            }

            _.forEach(this.props.api.definitions, function (model, modelName) {
                if (!model.properties) {
                    debug('model has no properties: %s', modelName);
                    return;
                }
                if (model['x-parent']) {
                    debug('parent: %s', model['x-parent']);
                    // if we have a parent then let our parent handle our setup.
                    return;
                }
                model.id = modelName;
                model.children = {};

                if (model['x-children']) {
                    debug('children: %s', model['x-children']);
                    _.forEach(model['x-children'], function(childName) {
                        debug('childName: %s', childName);
                        model.children[childName] = self.props.api.definitions[childName];
                    });
                }

                models[modelName] = model;
            });

            _.forEach(models, function (model, modelName) {

                var file = upath.addExt(
                    upath.joinSafe(basePath, modelName.toLowerCase()), '.js');

                // provides access to lodash within the template
                model._ = _;
                model.helpers = specutil;

                if (self.props.database) {
                    debug('generating mongoose enabled model: %s', modelName);
                    if (!self.options['dry-run']) {
                        self.template('_model_mongoose.js', file, model);
                    } else {
                        self.log.ok('(DRY-RUN) (db) model %s generated', file);
                    }
                } else {
                    debug('generating basic models: %s', modelName);
                    if (!self.options['dry-run']) {
                        self.template('_model.js', file, model);
                    } else {
                        self.log.ok('(DRY-RUN) model %s generated', file);
                    }
                }

            });
        }
    }

});
