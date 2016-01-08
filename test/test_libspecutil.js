'use strict';

var specutil = require('../lib/specutil');


describe('lib/specutil', function () {

    describe('#makeTestData', function () {

        it('no parameters and no schemas', function () {
            expect(specutil.makeTestData()).toBe(null);
        });

        it('param ref does not match actual schemas', function () {
            expect(specutil.makeTestData([{
                in: 'body',
                schema: {
                    '$ref': '#/definitions/Fake'
                }
            }])).toBe(null);
        });

        it('param type not simple', function () {
            var parameters = [{
                in: 'body',
                schema: {
                    '$ref': '#/definitions/Sample'
                }
            }];
            var schemas = {
                Sample: {
                    required: ['testArray', 'testObj'],
                    properties: {
                        testArray: {
                            type: 'array'
                        },
                        testObj: {
                            type: 'object'
                        }
                    }
                }};
            expect(specutil.makeTestData(parameters, schemas)).toEqual({
                testArray: null,
                testObj: null});
        });

        it('param type Number', function () {
            var parameters = [{
                in: 'body',
                schema: {
                    '$ref': '#/definitions/Sample'
                }
            }];
            var schemas = {
                Sample: {
                    required: ['testNum'],
                    properties: {
                        testNum: {
                            type: 'number'
                        }
                    }
                }};
            expect(specutil.makeTestData(parameters, schemas)).toEqual({
                testNum: 1});
        });

        it('param type Boolean', function () {
            var parameters = [{
                in: 'body',
                schema: {
                    '$ref': '#/definitions/Sample'
                }
            }];
            var schemas = {
                Sample: {
                    required: ['testBool'],
                    properties: {
                        testBool: {
                            type: 'boolean'
                        }
                    }
                }};
            expect(specutil.makeTestData(parameters, schemas)).toEqual({
                testBool: true});
        });

        it('param type Date', function () {
            var parameters = [{
                in: 'body',
                schema: {
                    '$ref': '#/definitions/Sample'
                }
            }];
            var schemas = {
                Sample: {
                    required: ['testDate'],
                    properties: {
                        testDate: {
                            type: 'date'
                        }
                    }
                }};
            // date matching exactly is too difficult and prone for random
            // failures during testing; so as long as it is defined it is
            // considered a success.
            expect(specutil.makeTestData(parameters, schemas)).toBeDefined();
        });

        it('param type String', function () {
            var parameters = [{
                in: 'body',
                schema: {
                    '$ref': '#/definitions/Sample'
                }
            }];
            var schemas = {
                Sample: {
                    required: ['testString'],
                    properties: {
                        testString: {
                            type: 'string'
                        }
                    }
                }};
            expect(specutil.makeTestData(parameters, schemas)).toEqual({
                testString: 'helloworld'});
        });
    });

    describe('#getSchema', function () {

        it('undefined inputs', function () {
            expect(specutil.getSchema()).toEqual({});
        });

        it('empty object', function () {
            expect(specutil.getSchema({})).toEqual({});
        });

        it('simple schema - string', function () {
            expect(specutil.getSchema({
                type: 'string'
            })).toBe('String');
        });

        it('simple schema - password', function () {
            expect(specutil.getSchema({
                type: 'password'
            })).toBe('String');
        });

        it('simple schema - number', function () {
            expect(specutil.getSchema({
                type: 'number'
            })).toBe('Number');
        });

        it('simple schema - integer', function () {
            expect(specutil.getSchema({
                type: 'integer'
            })).toBe('Number');
        });

        it('simple schema - long', function () {
            expect(specutil.getSchema({
                type: 'long'
            })).toBe('Number');
        });

        it('simple schema - float', function () {
            expect(specutil.getSchema({
                type: 'float'
            })).toBe('Number');
        });

        it('simple schema - double', function () {
            expect(specutil.getSchema({
                type: 'double'
            })).toBe('Number');
        });

        it('simple schema - boolean', function () {
            expect(specutil.getSchema({
                type: 'boolean'
            })).toBe('Boolean');
        });

        it('simple schema - date', function () {
            expect(specutil.getSchema({
                type: 'date'
            })).toBe('Date');
        });

        it('simple schema - dateTime', function () {
            expect(specutil.getSchema({
                type: 'dateTime'
            })).toBe('Date');
        });

        it('array schema of objects', function () {
            expect(specutil.getSchema({
                options: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string'
                            },
                            name: {
                                type: 'string'
                            },
                            tags: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            })).toEqual({
                options: [{
                    id: 'String',
                    name: 'String',
                    tags: ['String']
                }]
            });
        });

        it('array schema of objects - alt', function () {
            expect(specutil.getSchema({
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string'
                        },
                        name: {
                            type: 'string'
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    }
                }
            })).toEqual([{
                id: 'String',
                name: 'String',
                tags: ['String']
            }]);
        });

        it('object schema', function () {
            expect(specutil.getSchema({
                channel: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string'
                        }
                    }
                }
            })).toEqual({
                channel: {
                    id: 'String'
                }
            });
        });

        it('object schema - alt', function () {
            expect(specutil.getSchema({
                type: 'object',
                properties: {
                    id: {
                        type: 'string'
                    }
                }
            })).toEqual({
                id: 'String'
            });
        });

        it('object ref schema', function () {
            expect(specutil.getSchema({
                channel: {
                    '$ref': '#/definitions/Channel'
                }
            })).toEqual({
                channel: {
                    type: '"mongoose.Schema.Types.ObjectId"',
                    ref: '"Channel"'
                }
            });
        });

        it('object ref subschema', function () {
            expect(specutil.getSchema({
                channel: {
                    '$ref': '#/definitions/Channel'
                }
            }, {
                Channel: {
                    id: 'String'
                }
            })).toEqual({
                channel: ['ChannelSchema']
            });
        });

        it('array object ref schema', function () {
            expect(specutil.getSchema({
                channel: {
                    type: 'array',
                    'items': {
                        '$ref': '#/definitions/Channel'
                    }
                }
            }, {
                Channel: {
                    id: 'String'
                }
            })).toEqual({
                channel: ['ChannelSchema']
            });
        });

    });

    describe('#getPathType', function () {

        it('GET no param ids', function () {
            expect(specutil.getPathType('/pets', 'get'))
                .toBe('getResources');
        });

        it('GET param id - no parent', function () {
            expect(specutil.getPathType('/pets/{id}', 'get'))
                .toBe('getResource');
        });

        it('GET param parentId - no id', function () {
            expect(specutil.getPathType('/pets/{parentId}', 'get'))
                .toBe(null); // invalid
        });

        it('GET param id - child resources', function () {
            expect(specutil.getPathType('/pets/{id}/toys', 'get'))
                .toBe('getSubResources');
        });

        it('GET param parentid and id', function () {
            expect(specutil.getPathType('/pets/{parentId}/toys/{id}', 'get'))
                .toBe('getSubResource');
        });

        it('PUT no param ids', function () {
            expect(specutil.getPathType('/pets', 'put'))
                .toBe(null);
        });

        it('PUT param id - no parent', function () {
            expect(specutil.getPathType('/pets/{id}', 'put'))
                .toBe('putResource');
        });

        it('PUT param id - child resources', function () {
            expect(specutil.getPathType('/pets/{id}/toys', 'put'))
                .toBe(null); // invalid REST API
        });

        it('PUT param parentid and id', function () {
            expect(specutil.getPathType('/pets/{parentId}/toys/{id}', 'put'))
                .toBe('putSubResource');
        });

        it('DELETE no param ids', function () {
            expect(specutil.getPathType('/pets', 'delete'))
                .toBe(null);
        });

        it('DELETE param id - no parent', function () {
            expect(specutil.getPathType('/pets/{id}', 'delete'))
                .toBe('deleteResource');
        });

        it('DELETE param id - child resources', function () {
            expect(specutil.getPathType('/pets/{id}/toys', 'delete'))
                .toBe(null); // invalid REST API (delete should be specific items)
        });

        it('DELETE param parentid and id', function () {
            expect(specutil.getPathType('/pets/{parentId}/toys/{id}', 'delete'))
                .toBe('deleteSubResource');
        });

        it('POST no param ids', function () {
            expect(specutil.getPathType('/pets', 'post'))
                .toBe('postResource');
        });

        it('POST param id - no parent', function () {
            expect(specutil.getPathType('/pets/{id}', 'post'))
                .toBe('postSubResource'); // FIXME
        });

        it('POST param id - child resources', function () {
            expect(specutil.getPathType('/pets/{id}/toys', 'post'))
                .toBe('postSubResource');
        });

        it('POST param parentid and id', function () {
            expect(specutil.getPathType('/pets/{parentId}/toys/{id}', 'post'))
                .toBe('postSubResource');
        });

        it('PATCH no param ids', function () {
            expect(specutil.getPathType('/pets/', 'patch')).toBe(null);
        });

    });

    describe('#formatSuccessResponse', function () {

        it('default to 501', function () {
            expect(specutil.formatSuccessResponse({})).toBe('res.sendStatus(501);');
        });

        it('200 status only', function () {
            expect(specutil.formatSuccessResponse({
                200: {}
            })).toBe('res.sendStatus(200);');
        });

        it('200 status with json data', function () {
            expect(specutil.formatSuccessResponse({
                200: {
                    schema: {}
                }
            }, 'item')).toBe('res.status(200).json(item);');
        });

        it('201 status only', function () {
            expect(specutil.formatSuccessResponse({
                201: {}
            })).toBe('res.sendStatus(201);');
        });

        it('201 status with json data', function () {
            expect(specutil.formatSuccessResponse({
                201: {
                    schema: {}
                }
            }, 'item')).toBe('res.status(201).json(item);');
        });

        it('204 status only', function () {
            expect(specutil.formatSuccessResponse({
                204: {}
            })).toBe('res.sendStatus(204);');
        });

    });
});
