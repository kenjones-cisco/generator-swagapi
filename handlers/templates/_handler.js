'use strict';
var _ = require('lodash');
<% _.forEach(dbmodels, function(dbmodel) {%>
var <%=dbmodel.name%> = require('<%=dbmodel.path%>');<%})%>

/**
 * Operations on <%=path%>
 */
module.exports = {
<% _.forEach(methods, function (method, i) {%>
    /**
     * <%=method.description%>
     *
     * parameters: <%=method.parameters.map(function (p) { return p.name }).join(', ')%>
     */
    <%=method.method%>: function <%=method.name%>(req, res, next) {
    <% if (_.isEmpty(dbmodels)) {%>
        <%- include('default'); %>
    }<%if (i < methods.length - 1) {%>, <%}%>
    <%
        return;
    }
    var includeOpts = {
        Model: dbmodels[0].name,
        method: method,
        formatSuccessResponse: helpers.formatSuccessResponse
    };
    var includeSubOpts = _.defaults({
        subModelAttribute: helpers.getSubResourceAttribute(path)
    }, includeOpts);

    switch (helpers.getPathType(path, method.method)) {
        case 'getResources':%>
        <%- include('getResources', includeOpts); %>
        <%break;
        case 'getResource':%>
        <%- include('getResource', includeOpts); %>
        <%break;
        case 'getSubResources':%>
        <%- include('getSubResources', includeSubOpts); %>
        <%break;
        case 'getSubResource':%>
        <%- include('getSubResource', includeSubOpts); %>
        <%break;
        case 'putResource':%>
        <%- include('putResource', includeOpts); %>
        <%break;
        case 'putSubResource':%>
        <%- include('putSubResource', includeSubOpts); %>
        <%break;
        case 'deleteResource':%>
        <%- include('deleteResource', includeOpts); %>
        <%break;
        case 'deleteSubResource':%>
        <%- include('deleteSubResource', includeSubOpts); %>
        <%break;
        case 'postResource':%>
        <%- include('postResource', includeOpts); %>
        <%break;
        case 'postSubResource':%>
        <%- include('postSubResource', includeSubOpts); %>
        <%break;
        default:%>
        <%- include('default'); %>
    <%}%>
    }<%if (i < methods.length - 1) {%>, <%}%>
<%})%>
};
