var fs = require('fs');
var Module = require('module');
var path = require('path');
var shimmer = require('shimmer');

var modulesToPatch = ['express', 'koa-router', 'bluebird', 'es6-promise', 'cassandra-driver','mysql'];

function patchModules(agent){
	shimmer.wrap(Module, '_load', function (load) {
    return function (file) {
    	var loadedModule = load.apply(this, arguments);
    	var base = path.basename(file);
    	if(file.indexOf(__dirname) === -1 &&  modulesToPatch.indexOf(base) !== -1){
    		require(__dirname + '/module-load-patches/' + base)(agent, loadedModule);
    	}
      return loadedModule;
    }
  });
}


module.exports = {
	patch: function(agent){
		var patchers = fs.readdirSync(__dirname + '/patchers');
		patchers.forEach(function(patcher){
			(patcher.charAt(0) !== '.') && require(__dirname + '/patchers/' + patcher)(agent);
		})

		patchModules(agent);

	}
}