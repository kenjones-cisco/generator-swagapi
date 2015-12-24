/*eslint no-unused-vars: [2, {"args": "after-used", "argsIgnorePattern": "^next$"}]*/
'use strict';
var _ = {
    has: require('lodash/object/has')
};
var logger = require('./logger');

var handlers = module.exports;

// next will never be used as this is the end of the line; nothing
// should be done after it reaches this point.
handlers.errorHandler = function (err, req, res, next) {
    logger.debug('error name:', err.name);
    if (err.name === 'ValidationError') {
        // swagger ValidationError
        if (_.has(err, 'status') && _.has(err, 'details')) {
            logger.debug('swagger validation error:', err.details);
            res.status(err.status).json({
                error: err.details
            });
            return;
        }

        var errors = [];

        // mongoose ValidationError
        Object.keys(err.errors).forEach(function (field) {
            var error = err.errors[field];
            delete error.stack;
            errors.push(error);
        });

        logger.debug('validation errors:', errors);
        res.status(400).json({
            error: errors
        });
        return;
    }

    if (err.name === 'MongoError') {
        logger.debug('error message:', err.message);
        // duplicate index
        if (err.message.indexOf('duplicate key error') !== -1) {
            delete err.stack;
            res.status(400).json({
                error: err
            });
            return;
        }
    }

    // Swagger spec validation errors
    if (err.name === 'SyntaxError') {
        logger.debug('error message:', err.message);
        res.status(400).json({
            error: err.message
        });
        return;
    }

    if (res.statusCode === 401) {
        logger.debug('401 error:', err.message);
        res.status(401).json({
            error: err.message
        });
        return;
    }

    logger.debug('generic error:', err);
    res.status(500).json({
        error: err
    });

};
