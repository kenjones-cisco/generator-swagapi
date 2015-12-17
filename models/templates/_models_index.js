'use strict';
var _ = {
    capitalize: require('lodash/string/capitalize')
};
var fs = require('fs');

var models = module.exports;

var moduleName;
fs.readdirSync(__dirname).forEach(function (file) {
    if (file !== 'index.js') {
        moduleName = file.split('.')[0];
        models[_.capitalize(moduleName)] = require('./' + moduleName);
    }
});
