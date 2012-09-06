/**
 * Applitude - Application namespacing and module management.
 *
 * Depends on jQuery, EventEmitter2, and odotjs
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 * http://opensource.org/licenses/MIT
 */

/*global jQuery, EventEmitter2, odotjs, window, setTimeout,
console, exports, navigator */
(function (root, $, o, events) {
  'use strict';
  var namespace = 'applitude',
    debugLog = [],
    loadErrors = {},

    /**
     * Deferred utilities
     */
    deferred = $.Deferred,
    when = $.when,
    resolved = deferred().resolve().promise(),
    rejected = deferred().reject().promise(),
    app,
    register,
    stringToArray,
    addMixins,
    whenRenderReady = deferred(),
    setModule;

  setModule = function val(cursor, location, value) {
    var tree = location.split('.'),
      key = tree.shift(),
      returnValue;

    while (tree.length) {
      if (cursor[key] !== undefined) {
        cursor = cursor[key];
      } else {
        cursor = cursor[key] = {};
      }
      key = tree.shift();
    }

    if (cursor[key] === undefined) {
      cursor[key] = value;
      returnValue = true;
    } else {
      returnValue = false;
    }
    return returnValue;
  };

  stringToArray = function stringToArray(input, pattern) {
    var result;
    pattern = pattern || /\s*\,\s*/;

    result = (typeof input !== 'string') ?
      result = [] :
      result = input.trim().split(pattern);

    return result;
  };

  addMixins = function addMixins(module) {
    var mixins = stringToArray(module.mixins),
      backup = o.extend({}, module);
    mixins.forEach(function (mixin) {
      if (app[mixin]) {
        o.extend(module, app[mixin]);
      }
    });
    return o.extend(module, backup);
  };

  app = function applitudeFunction(appNs, environment, options) {
    var whenPageLoaded = deferred(),
      beforeRenderOption = (options && options.beforeRender) || [],
      beforeRender = [whenPageLoaded].concat(beforeRenderOption),
      tryRender;

    whenRenderReady = when.apply(null, beforeRender);

    tryRender = function tryRender(module) {
      if (typeof module.render === 'function') {
        whenRenderReady.then(module.render, module.render);
      }
    };

    register = function register(ns, module) {
      var whenLoaded,
        newModule;

      module.moduleNamespace = ns;

      newModule = setModule(app, ns, module, function () {
        app.events.trigger('module_added' + app.appNamespace, ns);            
      });

      if (newModule) {

        if (module.mixins) {
          addMixins(module);
        }

        // If load exists, try to load
        if (typeof module.load === 'function') {
          try {
            // If a promise is returned, wait for load to finish.
            whenLoaded = module.load();
            if (whenLoaded && whenLoaded.done) {
              whenLoaded.done(function () {
                tryRender(module);
              });
            } else {
              tryRender(module);
            }
          } catch (loadError) {
            loadErrors[ns] = loadError;
            app.log('Error loading module: ', ns, loadError);
          }
        } else if (!loadErrors[ns]) {
          // if .render() exists, try to render
          tryRender(module);
        }

      } else {
        app.log('Error: Module already registered: ', ns);
      }

      return app;
    };

    $(function () {
      whenPageLoaded.resolve();
    });

    // aliases
    events.trigger = events.emit;

    o.extend(app, {
      register: register,
      environment: environment,
      appNamespace: appNs,
      options: options
    });

    return app;
  };

  function on() {
    app.events.on.apply(app.events, arguments);
  }

  function trigger() {
    app.events.trigger.apply(app.events, arguments);
  }

  o.extend(app, {
    deferred: deferred,
    resolved: resolved,
    rejected: rejected,
    when: when,
    o: o,
    $: $,
    get: $.get,
    stringToArray: stringToArray,
    isArray: $.isArray,
    events: events,
    on: on,
    trigger: trigger,
    debugLog: debugLog
  });

  app.log = function log() {
    var debug = app.environment && app.environment.debug,
      hasConsole = (window.console !== undefined) && console.log;
    if (debug && hasConsole) {
      console.log.apply(console, [].slice.call(arguments, 0));
    } else {
      debugLog.push(arguments);
    }
  };

  root[namespace] = app;

}((typeof exports !== 'undefined') ?
    exports : window,
  jQuery,
  odotjs,
  new EventEmitter2({
    wildcard: true
  })));
