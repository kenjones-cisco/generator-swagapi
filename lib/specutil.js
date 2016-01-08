/*eslint quotes: [2, "single", "avoid-escape"]*/
'use strict';

var _ = require('lodash');
var _s = require('underscore.string');
var util = require('util');
var debug = util.debuglog('generator-swagapi');

var helpers = module.exports;


var refRegExp = /^#\/definitions\/(\w*)$/;
var pathParamRegExp = /^{.*}$/;


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

function getTestVal(property) {
    var dtype = _.get(simpleTypes, property.type);
    if (!dtype) {
        return null;
    }
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
}

function genSchemaData(schema) {
    if (!schema || !schema.required) {
        return null;
    }
    return _.mapValues(schema.properties, getTestVal);
}

helpers.makeTestData = function makeTestData(parameters, schemas) {
    schemas = schemas || {};

    if (!parameters || _.isEmpty(parameters)) {
        return null;
    }
    var data = {};
    _.forEach(parameters, function (param) {
        if (param.in === 'body' && param.schema.$ref) {
            data = genSchemaData(_.get(schemas, helpers.getPropertyRef(param.schema)));
        }
    });
    if (_.isEmpty(data)) {
        data = null;
    }
    return data;
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
                    type: _s.quote('mongoose.Schema.Types.ObjectId'),
                    ref: _s.quote(propType)
                };
            }
            // works like a continue loop
            return;
        }
        props[key] = helpers.getSchema(property, subSchema);
    });

    return props;
};

helpers.formatObject = function formatObject(object, subSchema) {
    return util.inspect(helpers.getSchema(object, subSchema)).replace(/'/g, '').replace(/"/g, "'");
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

helpers.getPathMetadata = function getPathMetadata(routePath) {
    var totParam = 0;
    var totPaths = 0;
    var metadata = {
        type: null,
        subResource: null,
        parentId: null,
        id: null
    };

    _.compact(routePath.split('/')).forEach(function (element) {
        if (pathParamRegExp.test(element)) {
            element = element.replace(/{/g, '').replace(/}/g, '');
            totParam += 1;
            if (!metadata.id) {
                metadata.id = element;
            } else if (!metadata.parentId) {
                metadata.parentId = metadata.id;
                metadata.id = element;
            }
        } else {
            totPaths += 1;
            metadata.subResource = element;
        }
    });

    if (totParam === 0 && totPaths > 0) {
        metadata.type = 'Resources';
    } else if (totParam === 1) {
        if (totPaths === 1) {
            metadata.type = 'Resource';
        }
        if (totPaths === 2) {
            metadata.type = 'SubResources';
        }
    } else if (totParam === 2) {
        metadata.type = 'SubResource';
    }

    debug('path metadata', metadata);
    return metadata;
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
