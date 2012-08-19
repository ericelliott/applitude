(function (app) {
  'use strict';

  /**
   * uniqueId
   * returns a short random string, prepended with epoch time
   * converted into a short sequence of characters.
   * 
   * @return [String] 
   */
  app.register('utils.uniqueId', function uniqueId() {
    return (new Date().getTime() << 0).toString(36)
        + ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).substr(-4);
  });

}(applitude));
