/*global test, ok, applitude, equal, deepEqual, start, expect, stop, jQuery*/
(function (app, $) {

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

    test('Applitude timing.', function () {
      var whenModuleReady = app.deferred(),
        hasRendered = false,
        whenAppInitFinished = app.options.whenAppInitFinished;
      app.register('testBeforeRender',
        {
          load: function load() {},
          render: function render() {
            ok(true, 'Render function should run.');
            start();
          }
        });

      expect(4);
      stop();

      // this is separate from above to make sure it's global.
      app.register('testModuleBeforeRender', {
        beforeRender: [whenModuleReady]
      });

      equal(hasRendered, false,
        'Render should wait until module beforeRender resolves.');

      whenModuleReady.done(function () {
        ok(true,
          'Module ready should resolve.');
      });

      whenAppInitFinished.done(function () {
        equal(hasRendered, false,
          'Render should wait for .register() beforeRender');

        whenModuleReady.resolve();
      });

      whenAppInitFinished.resolve();
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

    test('Promise flow utilities', function () {
      var taskA = app.deferred(),
        taskB = app.deferred(),
        taskC = app.deferred(),
        testQueue = app.queue([taskA.promise(), taskB.promise()]),
        allDone = false;

      stop();
      expect(4);

      testQueue.done(function () {
        allDone = true;

        equal(allDone, true, 
          'Queue should resolve when all queued promises resolve.');

        start();
      });

      ok(testQueue.state() !== 'resolved',
        'Queue should not be resolved until all queued promises resolve.');

      taskA.resolve();

      ok(testQueue.state() !== 'resolved',
        'Queue should not be resolved until all queued promises resolve.');

      testQueue.push(taskC.promise());

      taskB.resolve();

      ok(testQueue.state() !== 'resolved',
        'Queue should not be resolved until all queued promises resolve.');            

      taskC.resolve();
    });

    test('Utilities', function () {
      deepEqual(app.stringToArray('a, b, c'), ['a', 'b', 'c'],
        '.stringToArray() converts comma separated strings ' +
        'to arrays.');

      equal(app.isArray([1, 2, 3]), true,
        '.isArray() should return true for arrays.');

      equal(app.isArray({a:1, b:2, c:3}), false,
        '.isArray() should return false for objects.');

      equal(app.isArray('a, b, c'), false,
        '.isArray() should return false for strings.');

      equal(typeof app.uid(), 'string',
        '.uid() should return a string.');

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