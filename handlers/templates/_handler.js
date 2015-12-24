'use strict';
var _ = require('lodash');
<% _.forEach(dbmodels, function(dbmodel) {%>
var <%=dbmodel.name%> = require('<%=dbmodel.path%>');<%})%>
<%
var getPathType = function(routePath, verb) {
    var parent = false;
    var byId = false;
    var subDoc = false;
    routePath.split('/').forEach(function (element) {
        if (element) {
            if (element === '{parentId}') {
                parent = true;
            } else if (element === '{id}') {
                byId = true;
            } else {
                if (byId) {
                    subDoc = true;
                }
            }
        }
    });

    switch (verb) {
        case 'get':
            if (!byId && !parent) {
                return 'getResources';
            }
            if (byId) {
                if (parent) {
                    return 'getSubResource';
                }
                return subDoc ? 'getSubResources' : 'getResource';
            }
        case 'put':
            if (byId) {
                return parent ? 'putSubResource' : 'putResource';
            }
        case 'delete':
            if (byId) {
                return parent ? 'deleteSubResource' : 'deleteResource';
            }
        case 'post':
            return byId ? 'postSubResource' : 'postResource';
        // case 'patch':
        //     if (byId) {
        //         return parent ? 'patchSubResource' : 'patchResource';
        //     }
        default:
            break;
    }
    return null;
};

var getSubResourceAttribute = function (routePath) {
    var parts = routePath.split('/');
    var subattr = null;

    while (parts) {
        var part = parts.pop();
        if (part && part !== '{parentId}' && part !== '{id}') {
            subattr = part
            break;
        }
    }
    return subattr;
};

var formatSuccessResponse = function(responses, returnKey) {
    var result = 'res.sendStatus(501);';

    if (responses[200]){
        if (responses[200].schema) {
            result = 'res.status(200).json(' + returnKey + ');';
        } else {
            result = 'res.sendStatus(200);';
        }
    } else if (responses[201]) {
        if (responses[201].schema) {
            result = 'res.status(201).json(' + returnKey + ');';
        } else {
            result = 'res.sendStatus(201);';
        }
    } else if (responses[204]) {
        result = 'res.sendStatus(204);';
    }
    return result;
};
%>
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
    <% if (dbmodels === null || dbmodels.length === 0) {%>
        res.sendStatus(501);
        return next();
    }<%if (i < methods.length - 1) {%>, <%}%>
    <%
        return;
    }
    var Model = dbmodels[0].name;
    var subModelAttribute = getSubResourceAttribute(path);

    switch (getPathType(path, method.method)) {
        case 'getResources':%>
        var query = req.query;
        var filters = {};
        var fields = null;
        var options = {};

        _.forEach(query, function (item, key) {

            switch (key) {
                case 'fields':
                    if (item) {
                        fields = item.replace(',', ' ');
                    }
                    break;

                case 'sort':
                    if (item) {
                        options[key] = item.replace(',', ' ');
                    }
                    break;

                case 'offset':
                    if (!_.isUndefined(item) && !_.isNaN(_.parseInt(item))) {
                        options[key] = _.parseInt(item);
                    }
                    break;

                case 'limit':
                    if (!_.isUndefined(item) && !_.isNaN(_.parseInt(item))) {
                        options[key] = _.parseInt(item);
                    }
                    break;
                default:
                    filters[key] = item;
            }
        });

        if (_.isEmpty(options)) {
            options = null;
        }

        <%=Model%>.find(filters, fields, options).exec().then(function (results) {
            <%=formatSuccessResponse(method.responses, 'results')%>
            return next();
        }).then(null, function(err) {
            return next(err);
        });
        <%break;
        case 'getResource':%>
        var fields = !req.query.fields ? null : req.query.fields.replace(',', ' ');
        <%=Model%>.findById(req.params.id, fields).exec().then(function (item) {
            if (!item) {
                res.sendStatus(404);
                return next();
            }
            <%=formatSuccessResponse(method.responses, 'item')%>
            return next();
        }).then(null, function (err) {
            return next(err);
        });
        <%break;
        case 'getSubResources':%>
        <%=Model%>.findById(req.params.id).exec().then(function (item) {
            if (!item) {
                res.sendStatus(404);
                return next();
            }

            var subDoc = item.<%=subModelAttribute%>;
            <%=formatSuccessResponse(method.responses, 'subDoc')%>
            return next();
        }).then(null, function (err) {
            return next(err);
        });
        <%break;
        case 'getSubResource':%>
        <%=Model%>.findById(req.params.parentId).exec().then(function (item) {
            if (!item) {
                res.sendStatus(404);
                return next();
            }

            var subDoc = item.<%=subModelAttribute%>.id(req.params.id);
            if (!subDoc) {
                res.sendStatus(404);
                return next();
            }
            <%=formatSuccessResponse(method.responses, 'subDoc')%>
            return next();
        }).then(null, function (err) {
            return next(err);
        });
        <%break;
        case 'putResource':%>
        <%=Model%>.findByIdAndUpdate(req.params.id, req.body, {'new': true}).exec().then(function (item) {
            if (!item) {
                res.sendStatus(404);
                return next();
            }
            <%=formatSuccessResponse(method.responses, 'item')%>
            return next();
        }).then(null, function (err) {
            return next(err);
        });
        <%break;
        case 'putSubResource':%>
        <%=Model%>.findById(req.params.parentId).exec().then(function (item) {
            if (!item) {
                res.sendStatus(404);
                return next();
            }

            var subDoc = item.<%=subModelAttribute%>.id(req.params.id);
            if (!subDoc) {
                res.sendStatus(404);
                return next();
            }

            _.forEach(req.body, function(v, k) {
                subDoc[k] = v;
            });
            item.save(function (saveErr) {
                return next(saveErr);
            });

            <%=formatSuccessResponse(method.responses, 'subDoc')%>
            return next();
        }).then(null, function (err) {
            return next(err);
        });
        <%break;
        case 'deleteResource':%>
        <%=Model%>.findByIdAndRemove(req.params.id).exec().then(function (item) {
            if (!item) {
                res.sendStatus(404);
                return next();
            }
            <%=formatSuccessResponse(method.responses, 'item')%>
            return next();
        }).then(null, function (err) {
            return next(err);
        });
        <%break;
        case 'deleteSubResource':%>
        <%=Model%>.findById(req.params.parentId).exec().then(function (item) {
            if (!item) {
                res.sendStatus(404);
                return next();
            }
            item.<%=subModelAttribute%>.id(req.params.id).remove();
            item.save(function (saveErr) {
                return next(saveErr);
            });
            <%=formatSuccessResponse(method.responses, 'item')%>
            return next();
        }).then(null, function (err) {
            return next(err);
        });
        <%break;
        case 'postResource':%>
        <%=Model%>.create(req.body).then(function (item) {
            <%=formatSuccessResponse(method.responses, 'item')%>
            return next();
        }).then(null, function (err) {
            return next(err);
        });
        <%break;
        case 'postSubResource':%>
        <%=Model%>.findById(req.params.parentId).exec().then(function (item) {
            if (!item) {
                res.sendStatus(404);
                return next();
            }
            var subDoc = item.<%=subModelAttribute%>.addToSet(req.body);
            if (!subDoc) {
                res.sendStatus(400);
                return next();
            }
            item.save(function (saveErr) {
                return next(saveErr);
            });
            <%=formatSuccessResponse(method.responses, 'subDoc')%>
            return next();
        }).then(null, function (err) {
            return next(err);
        });
        <%break;
        default:%>
        res.sendStatus(501);
    <%}%>
    }<%if (i < methods.length - 1) {%>, <%}%>
<%})%>
};
