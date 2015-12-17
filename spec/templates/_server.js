'use strict';

var path = require('path');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var swaggerize = require('swaggerize-express');
var logger = require('./config/logger');
var errors = require('./config/errors');
var config = require('config');
<% if (database) {%>
var db = require('./config/db');<%}%>


var server = module.exports;

server.configure = function () {

    <% if (database) {%>
    // make sure the database connection is setup
    db.setup();

    logger.debug('loading models...');
    // make sure all schemas and models are loaded
    require('./models');<%}%>

    this.app = express();

    this.app.use(morgan('combined', {
        'stream': logger.stream
    }));
    this.app.use(bodyParser.json());

    this.app.use(swaggerize({
        api: path.resolve('./<%=apiPath%>'),
        handlers: path.resolve('./handlers')
    }));

    // must always be the very last handler!!!
    this.app.use(errors.errorHandler);

}.bind(this);

/* istanbul ignore next */
server.start = function () {
    var port = config.get('server.port');

    // configure the app for use
    this.configure();

    this.app.listen(port, function () {
        logger.info('Listening on %s', port);
    });
}.bind(this);

/* istanbul ignore if */
if (require.main === module) {
    this.start();
}
