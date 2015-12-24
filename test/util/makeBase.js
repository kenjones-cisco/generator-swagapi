'use strict';


/**
 * Returns a base options object
 */
module.exports = function makeBase(generator) {
    return {
        type: 'swagapi:' + generator,

        args: [],

        dependencies: [
            '../app',
            '../spec',
            '../models',
            '../handlers'
        ],

        options: {
            'skip-install': true
        },

        prompt: {
            'name': 'Foo'
        }
    };
};
