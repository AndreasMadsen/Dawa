module.exports = {
  singular: 'supplerendebynavn',
  plural: 'supplerendebynavne',
  key: ['navn']
};

var registry = require('../registry');
registry.add('supplerendebynavn', 'nameAndKey', undefined, module.exports);