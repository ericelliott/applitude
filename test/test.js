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
        '.register() fails on duplicate namespace.');
    });

    test('Applitude deep namespacing', function () {
      equal(typeof app.utils.uniqueId(), 'string',
        '.register() should work with functions.');

      app.register('utils.uniqueId', function () {
        return false;
      });

      equal(typeof app.utils.uniqueId(), 'string',
        '.register() should fail on duplicate register.');
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
      
      ok(app.resolved.isResolved,
        'app.resolved should be a resolved promise.');
      ok(app.rejected.isRejected,
        'app.rejected should be a rejected promise.');
      ok(app.when(app.resolved).isResolved(),
        '.when() should be available on applitude.');
      ok(app.when(app.rejected).isRejected(),
        '.when() should work for rejected state.');

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

      equal(testQueue.isResolved(), false,
        'Queue should not be resolved until all queued promises resolve.');

      taskA.resolve();

      equal(testQueue.isResolved(), false,
        'Queue should not be resolved until all queued promises resolve.');

      testQueue.push(taskC.promise());

      taskB.resolve();

      equal(testQueue.isResolved(), false,
        'Queue should not be resolved until all queued promises resolve.');            

      taskC.resolve();
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
          'An event triggered on app.events should be'
          + ' listenable with app.on().');
        start();
      });
      app.events.trigger('a');
    });

    test('app.trigger() shortcut', function () {
      stop();
      app.events.on('a', function () {
        ok(true,
          'An event triggered with app.trigger() should be'
          + ' listenable with app.events.on().');
        start();
      });
      app.trigger('a');
    });

  });

}(applitude, jQuery));