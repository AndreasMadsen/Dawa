"use strict";

var _ = require('underscore');
var apiSpecUtil = require('./apiSpecUtil');

exports.computeGetUrlTemplate = function (baseUrl, spec) {
  return baseUrl + '/' + spec.model.plural + _.map(apiSpecUtil.getKeyForSelect(spec),function (keyPart) {
    return '/{' + keyPart + '}';
  }).join('');
};
exports.computeGetParameters = function (apiSpec, docSpec) {
  var parameterNames = apiSpecUtil.getKeyForSelect(apiSpec);
  return _.map(parameterNames, function (parameterName) {
    return _.findWhere(docSpec.parameters, {name: parameterName});
  });
};

exports.computeQueryUrl = function (baseUrl, spec, query) {
  var url = baseUrl + '/' + spec.model.plural;
  if (!_.isEmpty(query)) {
    url += '?' + _.map(query,function (param) {
      return encodeURIComponent(param.name) + '=' + encodeURIComponent(param.value);
    }).join('&');
  }
  return url;
};
exports.computeGetUrl = function (baseUrl, spec, path) {
  var url = baseUrl + '/' + spec.model.plural + '/';
  url += _.map(path, encodeURIComponent).join('/');
  return url;
};

exports.extractDocumentationForObject = function (schema) {
  return _.map(schema.docOrder, function (propertyName) {
    var property = schema.properties[propertyName];
    var required = schema.required && schema.required.indexOf(propertyName) != -1;
    return exports.extractDocumentationForProperty(property, propertyName, required);
  });
};

// for now, this one just assumes that the schema is compiled
function resolveProperty(property) {
  var propertyDef;
  // use resolved $ref . Description not from $ref overrides.
  if (property.$ref) {
    propertyDef = _.clone(property.__$refResolved);
    if (property.description) {
      propertyDef.description = property.description;
    }
  }
  else {
    propertyDef = property;
  }
  return propertyDef;
}
exports.extractDocumentationForProperty = function (property, propertyName,required) {
  var propertyDef = resolveProperty(property);
  var result = {
    name: propertyName,
    description: propertyDef.description || '',
    type: propertyDef.type || 'string',
    required: required
  };

  if (propertyDef.type === 'array') {
    var itemDef = resolveProperty(propertyDef.items);
    if (itemDef.type === 'object') {
      result.items = exports.extractDocumentationForObject(itemDef);
    }
    else {
      throw 'Simple arrays not yet supported';
    }
  }
  else if (propertyDef.type === 'object') {
    result.properties = exports.extractDocumentationForObject(propertyDef);
  }
  return result;
};


exports.exampleDoc = [
  {
    name: 'href',
    description: 'Unikke url',
    type: 'string',
    required: true
  },
  {
    name: 'postnummer',
    description: 'postnummeret',
    type: 'object',
    required: true,
    properties: [
      {
        name: 'nr',
        description: 'postnummeret',
        type: 'integer',
        required: true
      }
    ]
  },
  {
    name: 'kommuner',
    description: 'kommunerne',
    type: 'array',
    required: false,
    items: [
      {
        name: 'href',
        description: 'kommunens URL',
        type: 'string',
        required: false
      }
    ]
  }
];