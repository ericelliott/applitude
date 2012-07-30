/**
 * Applitude - Application namespacing and module management.
 *
 * Relies on jQuery Deferred(), EventEmitter2, and odotjs
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */

/*global jQuery, EventEmitter2, odotjs */
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
    tryRender;

  stringToArray = function (input, pattern) {
    pattern = pattern || /\s*\,\s*/;
    return input.trim().split(pattern);
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
      whenRenderReady = when.apply(null, beforeRender),
      tryRender;

    tryRender = function tryRender(module) {
      if (typeof module.render === 'function') {
        whenRenderReady.then(module.render);
      }
    };

    register = function register(ns, module) {
      var whenLoaded;
      if (!app[ns]) {
        app[ns] = module;

        if (module.mixins) {
          addMixins(module);
        }

        // If load exists, try to load
        if (typeof module.load === 'function') {
          try {
            // If a promise is returned, wait for load to finish.
            whenLoaded = module.load();
            if (whenLoaded) {
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
    }, events);

    return app;
  };

  o.extend(app, {
    deferred: deferred,
    resolved: resolved,
    rejected: rejected,
    when: when,
    o: o.extend(o),
    events: events,
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

}((typeof exports !== 'undefined')
    ? exports
    : window,
  jQuery,
  odotjs,
  new EventEmitter2()));
