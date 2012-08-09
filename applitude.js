/**
 * Applitude - Application namespacing and module management.
 *
 * Depends on jQuery, EventEmitter2, and odotjs
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 * http://opensource.org/licenses/MIT
 */

/*global jQuery, EventEmitter2, odotjs */
(function () {
  'use strict';
  var deferredQueue = {};

  /**
   * deferredQueue - a deferred / promise queue to manage
   * asynchronous event timing.
   * 
   * Adpated from jQuery.deferred-queue under a BSD License:
   * https://bitbucket.org/masklinn/jquery.deferred-queue
   */
  (function ($) {
    $.extend(deferredQueue, {
      queue: function () {
        var queueDeferred = $.Deferred(),
          promises = 0,
          promise,
          resolve;

        resolve = function resolve() {
          if (--promises > 0) {
            return;
          }
          setTimeout($.proxy(queueDeferred, 'resolve'), 0);
        };

        promise = $.extend(queueDeferred.promise(), {
          push: function () {
            promises += 1;
            $.when.apply(null, arguments)
              .then(resolve, $.proxy(queueDeferred, 'reject'));
            return this;
          }
        });

        if (arguments.length) {
          promise.push.apply(promise, arguments);
        }

        return promise;
      }
    });
  }(jQuery));

  (function (root, $, o, events) {
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
      queue = deferredQueue.queue,
      app,
      register,
      stringToArray,
      addMixins,
      whenRenderReady = queue(),
      setModule;

    setModule = function val(cursor, location, value, cb) {
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
        tryRender;

      whenRenderReady.push.apply(whenRenderReady, beforeRender);

      tryRender = function tryRender(module) {
        if (typeof module.render === 'function') {
          whenRenderReady.then(module.render);
        }
      };

      register = function register(ns, module) {
        var whenLoaded,
          beforeRender = (module && module.beforeRender),
          newModule;

        module.moduleNamespace = ns;

        newModule = setModule(app, ns, module, function () {
          app.trigger('module_added' + app.appNamespace, ns);            
        });

        if (newModule) {

          if (module.mixins) {
            addMixins(module);
          }

          // Delay global render until promise is fulfilled?
          // Note, this will not work if render executes before
          // this module loads.
          if (beforeRender) {
            whenRenderReady.push.apply(whenRenderReady, beforeRender);
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
      }, events);

      return app;
    };

    o.extend(app, {
      deferred: deferred,
      resolved: resolved,
      rejected: rejected,
      when: when,
      queue: queue,
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

}());