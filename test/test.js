/*global test, ok, applitude, equal, deepEqual, start, expect, stop, jQuery*/
(function (app, $) {
  'use strict';
  (function (app) {
    var whenAppInitFinished = app.deferred();

    app.on('app_initialized', function () {
      whenAppInitFinished.resolve();
    });

    app('applitudeTest', {
        debug: true
      },
      {
        beforeRender: [whenAppInitFinished.promise()],
        optionAdded: true
      });    
  }(applitude));

  $(function () {
    test('Applitude core', function () {
      ok(applitude,
        'applitude should exist.');

      ok(app.environment && app.environment.debug,
        'Environment should load (triggered by app.js).');

      ok(app.options.optionAdded,
        'Options should get added to app object.');

    });

    test('Applitude namespacing', function () {
      app.register('namespaceTest', true);
      equal(app.namespaceTest, true,
        '.register() should assign namespace.');

      app.register('namespaceTest', 'fail');
      equal(app.namespaceTest, true,
        '.register() should not allow duplicate registrations.');
    });

    test('Applitude deep namespacing', function () {
      app.register('a.b.c', true);

      equal(app.a.b.c, true,
        '.register() should work with deep namespaces.');

      app.register('a.b.c', false);

      equal(app.a.b.c, true,
        '.register() should not allow duplicate registrations.');
    });

    test('Applitude timing', function () {
      var hasRendered = false;
      stop();
      app.register('testBeforeRender', {
        load: function load() {},
        render: function render() {
          hasRendered = true;
          ok(true, '.render() method should run');
          start();
        }
      });

      equal(hasRendered, false, 
        '.render() should wait for beforeRender to resolve.');

      app.trigger('app_initialized');
    });

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

    test('Deferred utilities', function () {
      
      equal(app.resolved.state(), 'resolved',
        'app.resolved should be a resolved promise.');
      equal(app.rejected.state(), 'rejected',
        'app.rejected should be a rejected promise.');
      ok(app.when(app.resolved).state(), 'resolved',
        'app.when() should be available.');

    });

    test('Utilities', function () {
      deepEqual(app.stringToArray('a, b, c'), ['a', 'b', 'c'],
        '.stringToArray() converts comma separated strings ' +
        'to arrays.');

      deepEqual(app.stringToArray(undefined), [],
        '.stringToArray() should handle undefined values');


      deepEqual(app.stringToArray('0'), ['0'],
        '.stringToArray() should handle falsy values');


      equal(app.isArray([1, 2, 3]), true,
        '.isArray() should return true for arrays.');

      equal(app.isArray({a:1, b:2, c:3}), false,
        '.isArray() should return false for objects.');

      equal(app.isArray('a, b, c'), false,
        '.isArray() should return false for strings.');


      deepEqual(app.o.mapOptions('a, b, c', 1, 2, 3),
        {a:1,b:2, c:3},
        '.mapOptions() should map parameters to names, ' +
        'and return the resulting named parameters hash.');
    });

    test('Logging', function () {
      ok(app.debugLog,
        'debugLog should exist');
    });

    test('Simple events', function () {
      stop();
      app.events.on('a', function () {
        ok(true,
          'A triggered event should be listenable.');
        start();
      });
      app.events.trigger('a');
    });

    test('Wildcard events', function () {
      stop();
      app.events.on('a.*', function () {
        ok(true,
          'A triggered event should be listenable.');
        start();
      });
      app.events.trigger('a.b');
    });

    test('app.on() shortcut', function () {
      stop();
      app.on('a', function () {
        ok(true,
          'An event triggered on app.events should be' +
          ' listenable with app.on().');
        start();
      });
      app.events.trigger('a');
    });

    test('app.trigger() shortcut', function () {
      stop();
      app.events.on('a', function () {
        ok(true,
          'An event triggered with app.trigger() should be ' +
          'listenable with app.events.on().');
        start();
      });
      app.trigger('a');
    });

  });

}(applitude, jQuery));