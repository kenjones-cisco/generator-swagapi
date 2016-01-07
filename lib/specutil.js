/*eslint quotes: [2, "single", "avoid-escape"]*/
'use strict';

var _ = require('lodash');
var _s = require('underscore.string');
var debug = require('util').debuglog('generator-swagapi');

var helpers = module.exports;


var refRegExp = /^#\/definitions\/(\w*)$/;

var allowedTypes = [
    'integer',
    'long',
    'float',
    'double',
    'number',
    'string',
    'password',
    'boolean',
    'date',
    'dateTime',
    'array',
    'object'
];

function propertyMap(property) {
    switch (property.type) {
        case 'integer':
        case 'long':
        case 'float':
        case 'double':
        case 'number':
            return 'Number';
        case 'string':
        case 'password':
            return 'String';
        case 'boolean':
            return 'Boolean';
        case 'date':
        case 'dateTime':
            return 'Date';
        case 'array':
            return [propertyMap(property.items)];
        case 'object':
            return helpers.getSchema(property.properties);
        default:
            throw new Error('Unrecognized schema type: ' + property.type);
    }
}

function isSimpleSchema(schema) {
    return schema.type && allowedTypes.indexOf(schema.type) !== -1;
}

helpers.getPropertyRef = function getPropertyRef(property) {
    if (_.get(property, '$ref')) {
        return _.get(property, '$ref');
    } else if (property.type === 'array' && _.get(property.items, '$ref')) {
        return _.get(property.items, '$ref');
    }
    return null;
};

helpers.getSchema = function getSchema(object, subSchema) {
    var refString;
    var propType;
    var props = {};
    subSchema = subSchema || {};

    _.forEach(object, function (property, key) {
        refString = helpers.getPropertyRef(property);
        if (refString) {
            propType = refString.match(refRegExp)[1];
            if (subSchema[propType]) {
                props[key] = [propType + 'Schema'];
            } else {
                props[key] = {
                    type: 'mongoose.Schema.Types.ObjectId',
                    ref: _s.quote(propType, "'")
                };
            }
        } else if (property.type === 'object') {
            props[key] = helpers.getSchema(property.properties, subSchema);
        } else if (property.type) {
            props[key] = propertyMap(property);
        } else if (isSimpleSchema(object)) {
            props = propertyMap(object);
        }
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
                schemas.push(refString.match(refRegExp)[1]);
            }
        });
    });

    debug(schemas);
    return _.uniq(schemas);
};
