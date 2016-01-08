'use strict';

var helpers = require('../lib/helpers');


describe('lib/helpers', function () {

    describe('#prefix', function () {

        it('str undefined and prefix undefined', function () {
            expect(helpers.prefix(undefined, undefined)).toBe('');
        });

        it('str does not contain prefix', function () {
            expect(helpers.prefix('concatenate', 'cat')).toBe('catconcatenate');
        });

        it('str does contain prefix', function () {
            expect(helpers.prefix('concatenate', 'con')).toBe('concatenate');
        });

    });

    describe('#unprefix', function () {

        it('str undefined and prefix undefined', function () {
            expect(helpers.unprefix(undefined, undefined)).toBe('');
        });

        it('str does not contain prefix', function () {
            expect(helpers.unprefix('concatenate', 'cat')).toBe('concatenate');
        });

        it('str does contain prefix', function () {
            expect(helpers.unprefix('concatenate', 'con')).toBe('catenate');
        });

    });

});
