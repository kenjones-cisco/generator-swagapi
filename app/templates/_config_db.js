'use strict';

var config = require('config');
var mongoose = require('mongoose');
var logger = require('./logger');

var connection = mongoose.connection;

var db = module.exports = {
    connecting: false,
    connected: false
};

db.setup = function () {
    var options, uri;
    var dbName = config.get('db.name');
    var host = config.get('db.host');
    var port = config.get('db.port');
    var login = '';

    logger.debug('db connecting: ' + this.connecting);
    if (this.connecting || this.connected) {
        return;
    }

    if (config.has('db.login') && config.has('db.password')) {
        login = config.get('db.login') + ':' + config.get('db.password') + '@';
    }
    if (config.has('db.uri')) {
        uri = config.get('db.uri');
    } else {
        uri = 'mongodb://' + login + host + ':' + port + '/' + dbName;
    }

    options = {
        db: {
            safe: true
        }
    };

    connection.once('connected', function () {
        logger.log('info', 'db connection established: (%s:%d/%s)', host, port, dbName);
        db.connected = true;
    });

    connection.on('disconnecting', function () {
        logger.log('info', 'db connection disconnecting: (%s:%d/%s)', host, port, dbName);
    });

    connection.on('error', function(err) {
        logger.log('error', 'db (%s)', dbName, err);
    });

    // Connect to Database
    this.connecting = true;
    mongoose.connect(uri, options);

};

process.on('SIGINT', function() {
    if (!db.connected) {
        return;
    }
    mongoose.connection.close(function () {
        logger.info('default connection disconnected through app termination');
    });
});
