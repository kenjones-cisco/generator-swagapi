'use strict';

var _ = require('lodash');
var util = require('util');
var debug = util.debuglog('generator-swagapi');

var helpers = module.exports;


var refRegExp = /^#\/definitions\/(\w*)$/;

var simpleTypes = {
    integer: 'Number',
    long: 'Number',
    float: 'Number',
    double: 'Number',
    number: 'Number',
    string: 'String',
    password: 'String',
    boolean: 'Boolean',
    date: 'Date',
    dateTime: 'Date'
};

helpers.normalizeURL = function normalizeURL(apipath) {
    var pathnames = [];

    apipath.split('/').forEach(function (element) {
        if (element) {
            pathnames.push(element);
        }
    });

    return pathnames.join('/');
};

helpers.getTestVal = function getTestVal(property) {
    var dtype = _.get(simpleTypes, property.type);
    if (dtype === 'Number') {
        return 1;
    }
    if (dtype === 'Boolean') {
        return true;
    }
    if (dtype === 'Date') {
        return Date.now();
    }
    return 'helloworld';
};

helpers.getPropertyRef = function getPropertyRef(property) {
    var refString;

    if (_.get(property, '$ref')) {
        refString = _.get(property, '$ref');
    } else if (property.type === 'array' && _.get(property.items, '$ref')) {
        refString = _.get(property.items, '$ref');
    }
    if (refString) {
        return refString.match(refRegExp)[1];
    }
    return null;
};

helpers.getSchema = function getSchema(object, subSchema) {
    var propType;
    var props = {};
    object = object || {};
    subSchema = subSchema || {};

    if (object.type === 'object') {
        return helpers.getSchema(object.properties);
    }
    if (object.type === 'array') {
        return [helpers.getSchema(object.items)];
    }
    if (object.type && _.has(simpleTypes, object.type)) {
        return _.get(simpleTypes, object.type);
    }

    _.forEach(object, function (property, key) {
        propType = helpers.getPropertyRef(property);
        if (propType) {
            if (subSchema[propType]) {
                props[key] = [propType + 'Schema'];
            } else {
                props[key] = {
                    type: 'mongoose.Schema.Types.ObjectId',
                    ref: util.format('%s', propType)
                };
            }
            // works like a continue loop
            return;
        }
        props[key] = helpers.getSchema(property, subSchema);
    });

    return props;
};

helpers.formatProperty = function formatProperty(property) {
    return JSON.stringify(property).replace(/"/g, '');
};

helpers.getRespSchema = function getRespSchema(object) {
    var refString;
    var schemas = [];

    _.forEach(object.methods, function (method) {
        _.forEach(method.responses, function (resp, code) {
            debug('checking response code: %s', code);
            refString = helpers.getPropertyRef(resp.schema || {});
            if (refString) {
                schemas.push(refString);
            }
        });
    });

    debug(schemas);
    return _.uniq(schemas);
};

helpers.getPathType = function getPathType(routePath, verb) {
    var parent = false;
    var byId = false;
    var subDoc = false;
    routePath.split('/').forEach(function (element) {
        if (element) {
            if (element === '{parentId}') {
                parent = true;
            } else if (element === '{id}') {
                byId = true;
            } else {
                if (byId) {
                    subDoc = true;
                }
            }
        }
    });

    switch (verb) {
        case 'get':
            if (!byId && !parent) {
                return 'getResources';
            }
            if (byId) {
                if (parent) {
                    return 'getSubResource';
                }
                return subDoc ? 'getSubResources' : 'getResource';
            }
            break;
        case 'put':
            if (byId && !subDoc) {
                return parent ? 'putSubResource' : 'putResource';
            }
            break;
        case 'delete':
            if (byId && !subDoc) {
                return parent ? 'deleteSubResource' : 'deleteResource';
            }
            break;
        case 'post':
            return byId ? 'postSubResource' : 'postResource';
        default:
            break;
    }
    return null;
};

helpers.getSubResourceAttribute = function getSubResourceAttribute(routePath) {
    var parts = routePath.split('/');
    var subattr = null;

    while (parts) {
        var part = parts.pop();
        if (part && part !== '{parentId}' && part !== '{id}') {
            subattr = part;
            break;
        }
    }
    return subattr;
};

helpers.formatSuccessResponse = function formatSuccessResponse(responses, returnKey) {
    var result = 'res.sendStatus(501);';

    if (responses[200]) {
        if (responses[200].schema) {
            result = 'res.status(200).json(' + returnKey + ');';
        } else {
            result = 'res.sendStatus(200);';
        }
    } else if (responses[201]) {
        if (responses[201].schema) {
            result = 'res.status(201).json(' + returnKey + ');';
        } else {
            result = 'res.sendStatus(201);';
        }
    } else if (responses[204]) {
        result = 'res.sendStatus(204);';
    }
    return result;
};
