// Shim support for CommonJS variables. This greatly reduces logic needed.
var global = global || this, module = module || undefined;

(function (app) {
  'use strict';

  // replace the namespace string with the name of your library
  var namespace = 'librarymodule',

    // replace this api with your library code
    api = {
      foo: function () {
        return 'foo';
      }
    };

  // don't change anything from here down.
  if (app.register) {
    app.register(namespace, api);
  } else {
    namespace = app.exports ? 'exports' : namespace;
    app[namespace] = api;
  }

}(global.applitude || module || this));
