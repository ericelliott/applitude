(function (app, $) {

  $(function () {
    var hasRendered = false;
    app.register('testBeforeRender',
      {
        load: function load() {},
        render: function render() {
          hasRendered = true;
        }
      });

    test('Applitude core', function () {
      ok(applitude,
        'applitude should exist.');

      ok(app.environment && app.environment.debug,
        'Environment should load (triggered by app.js).');

      ok(app.options.allClear,
        'Options should get added to app object.');

    });

    test('Applitude namespacing', function () {
      equal(typeof app.uniqueId(), 'string',
        '.register() should work with functions.');

      app.register('uniqueId', function () {
        return false;
      });

      equal(typeof app.uniqueId(), 'string',
        '.register() should throw an error on duplicate register.');
    });

    test('Applitude timing', function () {
      var whenModuleReady = app.deferred();

      app.register('testModuleBeforeRender', {
        beforeRender: [whenModuleReady]
      });

      equal(hasRendered, false,
        'Render should wait for app-level beforeRender promises to resolve.');

      app.options.allClear.resolve();

      stop();
      setTimeout(function () {
        equal(hasRendered, false,
          '.render() should not execute until module beforeRender resolves.');
      }, 0);
      start();

      stop();
      setTimeout(function () {
        equal(hasRendered, false,
          '.render() should execute when all beforeRender promises resolve.');
      }, 0);
      start();

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

      testQueue.done(function () {
        allDone = true;
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

      stop();
      setTimeout(function () {
        equal(allDone, true, 
          'Queue should resolve when all queued promises resolve.');
      }, 0);
      start();

    });

    test('Logging', function () {
      ok(app.debugLog,
        'debugLog should exist');
    });
  });

}(applitude, jQuery));