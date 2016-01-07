'use strict';
var mongoose = require('mongoose');


var <%=id%> = function () {
<% _.forEach(children, function (child, childName) {%>
    var <%=childName%>Schema = mongoose.Schema({<%
        var props = helpers.getSchema(child.properties);
        var totalProps = 1;
        if (typeof props === 'object') {
            totalProps = Object.keys(props).length;
        }
        var cnt = 0;
        _.forEach(props, function (property, key) {%>
        <%=key%>: <%=helpers.formatProperty(property)%><% if (totalProps - 1 !== cnt ) { %>,<% cnt += 1; }; %><%})%>
    });
<%})%>
    var <%=id%>Schema = mongoose.Schema({<%
        var props = helpers.getSchema(properties, children);
        var totalProps = 1;
        if (typeof props === 'object') {
            totalProps = Object.keys(props).length;
        }
        var cnt = 0;
        _.forEach(props, function (property, key) {%>
        <%=key%>: <%-helpers.formatProperty(property)%><% if (totalProps - 1 !== cnt ) { %>,<% cnt += 1; }; %><%})%>
	});
    return mongoose.model(<%-"'"+id+"'"%>, <%=id%>Schema);
};

module.exports = <%=id%>();
