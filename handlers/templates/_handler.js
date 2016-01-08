'use strict';
var _ = require('lodash');
<% _.forEach(dbmodels, function(dbmodel) {%>
var <%=dbmodel.name%> = require('<%=dbmodel.path%>');<%})%>

/**
 * Operations on <%=path%>
 */
module.exports = {
<% var metadata = helpers.getPathMetadata(path);
   _.forEach(methods, function (method, i) {%>
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
        formatSuccessResponse: helpers.formatSuccessResponse,
        subModelAttribute: metadata.subResource,
        id: metadata.id,
        parentId: metadata.parentId
    };

    switch (method.method + metadata.type) {
        case 'getResources':%>
        <%- include('getResources', includeOpts); %>
        <%break;
        case 'getResource':%>
        <%- include('getResource', includeOpts); %>
        <%break;
        case 'getSubResources':%>
        <%- include('getSubResources', includeOpts); %>
        <%break;
        case 'getSubResource':%>
        <%- include('getSubResource', includeOpts); %>
        <%break;
        case 'putResource':%>
        <%- include('putResource', includeOpts); %>
        <%break;
        case 'putSubResource':%>
        <%- include('putSubResource', includeOpts); %>
        <%break;
        case 'deleteResource':%>
        <%- include('deleteResource', includeOpts); %>
        <%break;
        case 'deleteSubResource':%>
        <%- include('deleteSubResource', includeOpts); %>
        <%break;
        case 'postResources':%>
        <%- include('postResources', includeOpts); %>
        <%break;
        case 'postSubResources':%>
        <%- include('postSubResources', includeOpts); %>
        <%break;
        default:%>
        <%- include('default'); %>
    <%}%>
    }<%if (i < methods.length - 1) {%>, <%}%>
<%})%>
};
