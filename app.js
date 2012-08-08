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
