'use strict';
var mongoose = require('mongoose');


var <%=id%> = function () {
<% _.forEach(children, function (child, childName) {%>
    var <%=childName%>Schema = mongoose.Schema(<%- helpers.formatObject(child.properties) %>);
<%})%>
    var <%=id%>Schema = mongoose.Schema(<%- helpers.formatObject(properties, children) %>);

    return mongoose.model(<%-"'"+id+"'"%>, <%=id%>Schema);
};

module.exports = <%=id%>();
