/*global require, console */
var fs = require('fs-extra');

fs.copy('./node_modules/eventemitter2/lib/eventemitter2.js',
  './lib/eventemitter2.js', function(err){
  if (err) {
    console.warn(err);
  } else {
    console.log('copied eventemitter2 to lib');
  }
});

fs.copy('./node_modules/odotjs/o.js', './lib/o.js', function(err){
  if (err) {
    console.warn(err);
  } else {
    console.log('copied o.js to lib');
  }
});
