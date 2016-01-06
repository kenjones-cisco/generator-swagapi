'use strict';

var fs = require('fs');
var path = require('path');
var _s = require('underscore.string');
var jsYaml = require('js-yaml');
var debug = require('util').debuglog('generator-swagapi');

var helpers = module.exports;

helpers.debug = debug;

helpers.fileExists = function fileExists(file) {
    var exists = true;

    try {
        fs.statSync(file);
    } catch (err) {
        exists = false;
    }
    return exists;
};

helpers.findFile = function findFile(name, root, project) {
    var location;
    debug('name: %s root: %s project: %s', name, root, project);

    if (!name) {
        return name;
    }

    location = path.resolve(root, name);
    debug('resolve to root: %s', location);
    if (helpers.fileExists(location)) {
        return location;
    }

    location = path.resolve(project, name);
    debug('resolve to project: %s', location);
    if (helpers.fileExists(location)) {
        return location;
    }
    debug('using default: %s', name);
    return name;
};

helpers.isRemote = function isRemote(apiPath) {
    return apiPath && apiPath.indexOf('http') === 0;
};

helpers.isYaml = function isYaml(file) {
    if (_s.endsWith(file, '.yaml') || _s.endsWith(file, '.yml')) {
        return true;
    }
    return false;
};

helpers.loadApi = function loadApi(apiPath, content) {
    if (helpers.isYaml(apiPath)) {
        debug('loading api using yaml');
        return jsYaml.safeLoad(content);
    }
    debug('loading api using json');
    return JSON.parse(content);
};

helpers.prefix = function prefix(str, pre) {
    str = str || '';
    if (str.indexOf(pre) === 0) {
        return str;
    }

    str = pre + str;
    return str;
};

helpers.unprefix = function unprefix(str, pre) {
    str = str || '';
    if (str.indexOf(pre) === 0) {
        str = str.substr(pre.length);
        return str;
    }

    return str;
};
