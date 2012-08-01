# Applitude - Simple module management.

**Status** - Applitude is in production use with millions of monthly active users. However, it is very new, and is in use by relatively few projects. It might be buggy. It might not work as expected. It definitely isn't well documented. Please feel free to kick the tires and contribute bug fixes, but for now, only experts who feel confident to debug issues and contribute bug fixes should attempt to use this in a production codebase.

**A Simple Applitude Module** - *Tip:* Wrap your module with an Immediately Invoked Anonymous Expression (IIFE), and pass applitude into it to create a handy 'app' shortcut in your code:

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


Applitude is a simple module management solution that serves the following needs:

* **Namespacing**. Modules can only be registered once, in order to avoid duplicate code runs, and tricky associated bugs.

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

* **A sandbox** to access libraries through a canonical interface, rather than calling library code directly. Doing so allows you to modify the implementation, or swap out the library completely with transparency to the application code.

* **Loading performance boost**. Loading data blocks data rendering, so it makes sense to load data as early as possible using non-blocking means in order to render it as quickly as possible. Applitude decouples data loading from data rendering via .load() and .render() methods. .load() runs as early as possible, and .render() runs only after page ready and beforeRender have both finished.

* **beforeRender** is a list of promises which all must finish before .render() begins. For example, many apps will need i18n translations to load before any module is allowed to render. By adding an i18n promise to the application's beforeRender queue, you can postpone render until the translations are loaded. Using beforeRender can prevent tricky race condition bugs from cropping up, and provide a neat solution if you need a guaranteed way to handle tasks before the modules render.

        var whenModuleReady = app.deferred();
  
        app.register('testModuleBeforeRender', {
          beforeRender: [whenModuleReady]
        });

* **Environment**. A canonical place to store application environment variables -- things like urls for development, staging, or production servers, etc... You can pass an environment object into the app in the initial applitude call.

* **Mixins**. Each module can declare a list of other modules to mix in with applitude. The new module can selectively override attributes from the mixed-in modules. The mixins later in the list will override attributes picked up from mixins earlier in the list... in other words, for collisions, the last mixin wins.
    
        
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

* **Deferred utilities** - Applitude relies on promises and deferreds from the jQuery library (along with other jQuery goodness, such as the page ready function). Applitude exposes a few Deferred utilities, including .resolved (a resolved promise), .rejected (a rejected promise), and .when (a utility that allows you to run callbacks only after all promises passed to it are resolved). These utilities can be helpful for coordinating asynchronous events in your application.