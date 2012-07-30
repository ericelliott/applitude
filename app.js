(function (app) {
  var namespace = 'applitudeTest',
    allClear = app.deferred();

  app(namespace,
    {
      debug: true
    },
    {
      beforeRender: [allClear.promise()],
      allClear: allClear
    });
}(applitude));
