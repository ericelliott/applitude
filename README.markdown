# Applitude.JS - Simple module management.

Applitude is a simple event-driven client-side JavaScript application architecture and module management framework that serves the following needs:

* Namespacing
* Sandbox
* Environment
* Loading performance boost
* Mixins
* Deferred utilities

View the slideshow: ["Introducing Applitude: Simple Module Management"](https://docs.google.com/presentation/embed?id=1BQ6s5EzLqenWZX1RCUIgVlJViKzjZAvvxN4UVkQzspo&start=false&loop=false&delayms=10000)

**Status** - Developer preview (stick to tested, documented features for best results). In production use with millions of monthly active users.
There are [unit tests](http://applitude.herokuapp.com/) covering most of the functionality. [![Build Status](https://secure.travis-ci.org/dilvie/applitude.png)](http://travis-ci.org/dilvie/applitude)

The guiding philosophy of Applitude is “Less is more.” Applitude sets up the sandbox and then gets out of the way of your modules. Hence the subtitle, “Simple Module Management.”


## A Simple Applitude Module

*Tip:* Wrap your module with an Immediately Invoked Anonymous Expression (IIFE), and pass applitude into it to create a handy 'app' shortcut in your code:

    (function (app) {
      'use strict';
    
      /**
       * uniqueId
       * returns a short random string, prepended with epoch time
       * converted into a short sequence of characters.
       * 
       * @return [String] 
       */
      app.register('uniqueId', function uniqueId() {
        return (new Date().getTime() << 0).toString(36)
            + ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).substr(-4);
      });
    
    }(applitude));

## Create an app

    app(namespace, environmentObject, optionsObject);

### Environment

Environment is made up of things like image hosting URLs which might vary from one host or CDN to another. Generally server side environments will also contain passwords, secrets, or tokens for communicating with third party APIs. Since the client-side JavaScript environment is not secure, you should not pass those secrets through to the JavaScript layer.

Environment variables should be passed into your application from your environment configuration, and not hard-coded. Your application should be portable to new hardware or hosts without any changes to your codebase.

It might be tempting to pass a single environment string through and put logic in your code to determine URLs and so on, but that should be done at the configuration level wherever possible. That will make it easier to port your app to new environments.

As a general rule of thumb, your app should be ready to open-source at any time, even if you never intend to do it. That mode of thought will help establish the proper separation of environment configuration and secrets from application code.

Applitude expects at least one varible to be defined: `debug` (Bool) If `debug` is true, anything logged with `app.log()` will be printed to the console (if available).

For more on application configuration, see ["The Twelve-Factor App"](http://www.12factor.net/config)

### Options

It will also look for a beforeRender array of promises. If passed, no modules will render until all beforeRender promises have resolved.

Any other options will be made available on the `app.options` object. Here's a sample:

    (function (app) {
      var namespace = 'applitudeTest',
        whenAppInitFinished = app.deferred();
    
      app(namespace,
        {
          debug: true
        },
        {
          beforeRender: [whenAppInitFinished.promise()],
          optionAdded: true,
          whenAppInitFinished: whenAppInitFinished
        });
    }(applitude));

## Applitude Responsibilities

### Events

Modules should know as little as possible about each other. To that end, modules should communicate through a global event bus, supplied by the applitude sandbox. You can use `app.on()` to subscribe to events, and `app.trigger()` to publish.

    app.on('a.*', function (data) { 
        console.log(data);
    });
    
    // later
    app.trigger('a.b', 'hello, world'); // logs 'hello, world'

Best practice is to get specific about the events you report, and always use your modules namespace to trigger. For example:


    (function (app) {
        var namespace = 'videoPlayer',
            api;
    
        function bindEvents() {
            app.$('#' + namespace).on('click', '#playButton', function (event) {
                app.trigger('click.' + namespace, event);
            });
        }
    
        // Wait for the dom to be ready before we try to 
        api = {
            render: bindEvents
        };
    
        app.register(namespace, api);
    }(applitude));
    
Events support wildcards. This way, you can implement cross-cutting concerns. For example, log every click in your app:

    (function (app) {
        var namespace = 'clickLogger',
            api;
        
        app.on('click.*', function logData(event) {
            // Implement real logging here. This just spits it into the in-memory app log.
            app.log(event);
        });
        
        function recent() {
            // get recent log entries
        }
        
        api = {
            recent: recent
        };
        
        app.register(namespace, api);
    }(applitude));

## Sandbox

Access libraries and utulities through a canonical interface, rather than calling library code directly. Doing so allows you to modify the implementation, or swap out the library completely with transparency to the application code.

### Included utilities

* A selector engine for dom utulities as `app.$()`.
* `app.isArray()`
* `app.stringToArray()` transforms `'a, string'` to `['a', 'string']`
* `app.uid()` returns a short random string suitable for unique ids
* `app.o()` provides a [prototypal oo libarary called odotjs](http://dilvie.github.com/odotjs/).
* `app.o.mapOptions` transforms any function into a polymorphic function which can take either a list of aurgemnts, or a named options hash.

        function foo(param1, param2, param3) {
            var options = mapOptions('param1, param2, param3', param1, param2, param3);
            
            // Log the value of param2, regardless of whether
            // the function was called with a named parameters
            // object, or comma separated arguments.
            console.log(options.param2);
        }

## Namespacing

Modules can only be registered once, in order to avoid duplicate code runs, and tricky associated bugs.

    // A module to generate short unique ID strings...
    app.register('uniqueId', function uniqueId() {
      return (new Date().getTime() << 0).toString(36)
          + ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).substr(-4);
    });


    // elsewhere...
    test('Applitude namespacing', function () {
      equal(typeof app.uniqueId(), 'string',
        '.register() should work with functions.');

      app.register('uniqueId', function () {
        return false;
      });

      equal(typeof app.uniqueId(), 'string',
        '.register() should throw an error on duplicate register.');
    });

## Loading performance boost

Loading data blocks data rendering, so it makes sense to load data as early as possible using non-blocking means in order to render it as quickly as possible. Applitude decouples data loading from data rendering via .load() and .render() methods. .load() runs as early as possible, and .render() runs only after page ready and beforeRender have both finished.

## beforeRender 

beforeRender is a list of promises which all must finish before .render() begins. For example, many apps will need i18n translations to load before any module is allowed to render. By adding an i18n promise to the application's beforeRender queue, you can postpone render until the translations are loaded. Using beforeRender can prevent tricky race condition bugs from cropping up, and provide a neat solution if you need a guaranteed way to handle tasks before the modules render.

    var whenModuleReady = app.deferred();

    app.register('testModuleBeforeRender', {
      beforeRender: [whenModuleReady]
    });


## Mixins

Each module can declare a list of other modules to mix in with applitude. The new module can selectively override attributes from the mixed-in modules. The mixins later in the list will override attributes picked up from mixins earlier in the list.

    test('Applitude mixins', function () {
      app.register('aMixin', {
        foo: 'foo',
        bar: 'bar'
      });
      app.register('usesMixin', {
        bar: 'baz',
        mixins: 'aMixin'
      });
    
      equal(app.usesMixin.foo, 'foo',
        'Register should pull in module mixins.');
    
      equal(app.usesMixin.bar, 'baz',
        'Modules should be able to override mixins.');
    
      equal(app.aMixin.bar, 'bar',
        'Original mixin should not be modified by override.');
    });

## Deferred utilities

Applitude relies on promises and deferreds from the jQuery library (along with other jQuery goodness, such as the page ready function). 

Applitude exposes a few Deferred utilities, including:

* `.resolved` - a resolved promise
* `.rejected` - a rejected promise
* `.when()` - a utility that allows you to run callbacks only after all promises passed to it are resolved
* `.queue()` - like `.when()`, but you can add promises to the wait queue at any time.

These utilities can be helpful for coordinating asynchronous events in your application.