# Applitude.JS - Simple module management.

Applitude is a simple event-driven client-side JavaScript application architecture and module management framework that serves the following needs:

* Namespacing
* Sandbox
* Environment
* Loading performance boost
* Mixins
* Deferred utilities

# **View the slideshow: ["Introducing Applitude: Simple Module Management"](https://docs.google.com/presentation/embed?id=1BQ6s5EzLqenWZX1RCUIgVlJViKzjZAvvxN4UVkQzspo&start=false&loop=false&delayms=10000)**

**Status** - Developer preview (stick to tested, documented features for best results). In production use with millions of monthly active users.
There are [unit tests](http://applitude.herokuapp.com/) covering most of the functionality. [![Build Status](https://secure.travis-ci.org/dilvie/applitude.png)](http://travis-ci.org/dilvie/applitude)

The guiding philosophy of Applitude is “Less is more.” Applitude sets up the sandbox and then gets out of the way of your modules. Hence the subtitle, “Simple Module Management.”

Applitude was created to illustrate how to implement a client-side JavaScript application architecture for the upcoming book "Programming JavaScript Applications" (O'Reilly).

## Who's Using Applitude?

* [Tout](http://tout.com/)
* [Your company here](https://github.com/dilvie/applitude/issues/new?title=Add+Me+to+the+Applitude+User+List) - Drop me a note if you're using Applitude.

## Getting started

    $ git clone git://github.com/dilvie/applitude.git

If you already have the dependencies ready, just drop `applitude/dist/applitude.js` into your project's lib folder and include it in your HTML build after the dependencies have loaded.

If you need the dependencies as well, you can use npm to pull them in (with the exception of jQuery). They will be installed in `applitude/lib/`.

If you don't have node installed, you can download it from `http://nodejs.org/download/`.

    $ cd applitude
    $ npm install

### Create an app

    app(namespace, environmentObject, optionsObject);

### Create your first applitude module

First you'll need an IIFE (Immediately Invoked Function Expression) for encapsulation:
    
    (function (app) {
        // your code here
    }(applitude));


And a namespace:

    (function (app) {
      // namespace should be a var
      var namespace = 'hello';
    }(applitude));


Provide an API:

    (function (app) {
      'use strict';
      var namespace = 'hello',
        api;
    
      function hello() {
        return 'hello, world';
      }
    
      api = {
        hello: hello
      };
    
      //..

    }(applitude));


Register your module:

    (function (app) {
      'use strict';
      var namespace = 'hello',
        api;
    
      function hello() {
        return 'hello, world';
      }
    
      api = {
        hello: hello
      };
    
      app.register(namespace, api);
    }(applitude));

You might be tempted to create shortcuts like:


    (function (app) {
      'use strict';
    
      app.register('hello', {
        hello: function () {
          return 'hello, world';
        });

    }(applitude));    

However, once you get into the Applitude groove, you'll be using a lot of events, and declaring a namespace lets you do things like this:

    app.trigger('some_action.' + namespace, eventData);

Then, if you need to move responsibilities from one module to another, or change the name of your module, you don't have to change any of this code.

Also, declaring your API explicitly makes it immediately clear which parts of your module constitute the exposed interface:

      api = {
        hello: hello
      };

In this case, it's just `hello`, but most interfaces will be more complicated. This is also a great clue about what you need to write tests for. If it's not in the API, don't write tests for it. You should be testing that your interface conforms to the contract.

When you declare you're API, you're making an implied guarantee that users can safely use the attributes exposed on that API, so you need to write unit tests to be sure that's the case.


### Loading and Rendering

Module initialization is broken into two phases:

#### Load

The first is the load phase. Your `.load()` method is called by Applitude as soon as your script is evaluated and the `app.register()` method is called.

#### Render

The `.render()` method is called after:

1. all `.beforeRender` callbacks have fired, and
1. the DOM is ready to be manipulated

If you need to fetch some data asynchronously before you render your module, Applitude helps speed things up by launching your asynchronous calls as early as possible. Just load your data in the `.load()` method. For example, grab Skrillex info from BandsInTown:

    (function (app) {
      'use strict';
      var namespace = 'skrillexInfo',
        api,
        data,
        whenLoaded;
    
      function load() {
        var url = 'http://api.bandsintown.com/artists/Skrillex.' +
        'json?api_version=2.0&app_id=YOUR_APP_ID';

        whenLoaded = app.get(url);
        whenLoaded.done(function (response) {
          data = response;
        });

        return whenLoaded.promise();
      }

      function render() {
        // do something with data at render time.
      }
    
      api = {
        load: load,
        render: render
      };
    
      app.register(namespace, api);
    }(applitude));

Tip: Try not to do anything blocking in your `.load()` method. For example, you might want to fetch the data that you need to complete your page render, but if you're loading a fairly large collection and you need to iterate over the collection and do some data processing, save the data processing step for `.render()` time, when you're not blocking the page render process.

*Note that you cannot manipulate the DOM at all in your `.load()` method.*

## Environment

Environment is made up of things like image hosting URLs which might vary from one host or CDN to another. Generally server side environments will also contain passwords, secrets, or tokens for communicating with third party APIs. Since the client-side JavaScript environment is not secure, you should not pass those secrets through to the JavaScript layer.

Environment variables should be passed into your application from your environment configuration, and not hard-coded. Your application should be portable to new hardware or hosts without any changes to your codebase.

It might be tempting to pass a single environment string through and put logic in your code to determine URLs and so on, but that should be done at the configuration level wherever possible. That will make it easier to port your app to new environments.

As a general rule of thumb, your app should be ready to open-source at any time, even if you never intend to do it. That mode of thought will help establish the proper separation of environment configuration and secrets from application code.

Applitude expects at least one varible to be defined: `debug` (Bool) If `debug` is true, anything logged with `app.log()` will be printed to the console (if available).

For more on application configuration, see ["The Twelve-Factor App"](http://www.12factor.net/config)

## Options

### beforeRender

beforeRender is a list of application-level promises which all must finish before .render() begins. For example, many apps will need i18n translations to load before any module is allowed to render. By adding an i18n promise to the application's beforeRender queue, you can postpone render until the translations are loaded. Using beforeRender can prevent tricky race condition bugs from cropping up, and provide a neat solution if you need a guaranteed way to handle tasks before the modules render.

You can resolve beforeRender promises by listening for an expected event to fire:

    (function (app) {
      var whenI18nLoaded = app.deferred();

      app.on('translations_loaded.i18n', function () {
        whenI18nLoaded.resolve();
      });

      app('hello', {
          debug: true
        },
        {
          beforeRender: [whenI18nLoaded.promise()],
          optionAdded: true
        });    
    }(applitude));

Later:

    whenTranslationsLoaded.done(function () {
      app.trigger('translations_loaded.' + namespace);
    });

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

Access libraries and utilities through a canonical interface, rather than calling library code directly. Doing so allows you to modify the implementation, or swap out the library completely with transparency to the application code.

### Included utilities

* `app.$()` - A selector engine for dom utulities
* `app.isArray()` - returns true if the argument is an array
* `app.stringToArray()` transforms `'a, string'` to `['a', 'string']`
* `app.o()` provides a [prototypal oo libarary called odotjs](http://dilvie.github.com/odotjs/)


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

These utilities can be helpful for coordinating asynchronous events in your application.


## Writing Applitude-Compatible Library Code

If you want to write general-purpose library modules that you can use with or without Applitude (including Node support), this pattern might help:

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
        app.exports = api;
      }
    
    }(global.applitude || module || this));


At the bottom of the Immediately Invoked Function Expression (IIFE), you attempt to pass in applitude if it exists. Otherwise, pass in either the CommonJS `module` (for Node), or `this`.