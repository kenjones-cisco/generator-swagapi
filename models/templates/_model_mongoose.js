'use strict';
var mongoose = require('mongoose');
<%
var allowedTypes = ['integer', 'long', 'float', 'double', 'number', 'string', 'password', 'boolean', 'date', 'dateTime', 'array', 'object'];
var propertyMap = function (property) {
    switch (property.type) {
        case 'integer':
        case 'long' :
        case 'float' :
        case 'double' :
        case 'number' :
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
            return getSchema(property.properties);
        default:
            throw new Error('Unrecognized schema type: ' + property.type);
    }
};

var isSimpleSchema = function(schema) {
    return schema.type && isAllowedType(schema.type);
};

var isAllowedType = function(type) {
    return allowedTypes.indexOf(type) != -1;
};

var isPropertyHasRef = function(property) {
    return property['$ref'] || ((property['type'] == 'array') && (property['items']['$ref']));
};

var getSchema = function(object, subSchema) {
    var props = {};
    subSchema = subSchema || {};

    _.forEach(object, function (property, key) {
        if (isPropertyHasRef(property)) {
            var refRegExp = /^#\/definitions\/(\w*)$/;
            var refString = property['$ref'] ? property['$ref'] : property['items']['$ref'];
            var propType = refString.match(refRegExp)[1];
            if (subSchema[propType]) {
                props[key] = [propType + 'Schema'];
            } else {
                props[key] = {type: "mongoose.Schema.Types.ObjectId", ref: "'" + propType + "'"}
            }
        }
        else if (property.type === 'object') {
            props[key] = getSchema(property.properties, subSchema);
        }
        else if (property.type) {
            props[key] = propertyMap(property);
        }
        else if (isSimpleSchema(object)) {
            props = propertyMap(object);
        }
    });

    return props;
};

var formatProperty = function(property) {
    return JSON.stringify(property).replace(/"/g,"");
};%>

var <%=id%> = function () {
<% _.forEach(children, function (child, childName) {%>
    var <%=childName%>Schema = mongoose.Schema({<%
        var props = getSchema(child.properties);
        var totalProps = 1;
        if (typeof props === 'object') {
            totalProps = Object.keys(props).length;
        }
        var cnt = 0;
        _.forEach(props, function (property, key) {%>
        <%=key%>: <%=formatProperty(property)%><% if (totalProps - 1 !== cnt ) { %>,<% cnt += 1; }; %><%})%>
    });
<%})%>

    var <%=id%>Schema = mongoose.Schema({<%
        var props = getSchema(properties, children);
        var totalProps = 1;
        if (typeof props === 'object') {
            totalProps = Object.keys(props).length;
        }
        var cnt = 0;
        _.forEach(props, function (property, key) {%>
        <%=key%>: <%-formatProperty(property)%><% if (totalProps - 1 !== cnt ) { %>,<% cnt += 1; }; %><%})%>
	});
    return mongoose.model(<%-"'"+id+"'"%>, <%=id%>Schema);
};

module.exports = <%=id%>();
