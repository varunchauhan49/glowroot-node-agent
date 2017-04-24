var ClientStub = require('./ClientStub');
var cwd = process.cwd();
var Config = require('./config');
var config = new Config();

var appname;
if(cwd) {
	appname = require(cwd + '/package.json').name;
}

function Harvester(agent){
}

Harvester.prototype = {
	timer: function(collect){
		var self = this;
		var collectInterval = setInterval(function(){
			process.nextTick(self.process.bind(self,collect));
		}, config.durationHarvestCycle);
	},
	process: function(collect){
		collect.systemCollector.collect();
		var http = collect.httpCollector.collection;
		var error = collect.errorCollector.collection;
		var system = collect.systemCollector.collection;
		ClientStub.getInitMessage(system,appname);
		ClientStub.collectAggregateStream(
			http,
			system,
			collect.httpCollector.hdr,
			collect.httpCollector.totalDuration,
			collect.httpCollector.totalTransaction,
			collect.httpCollector.totalErrorCountHttp);
		ClientStub.collectTraceStream(
			http,
			system,
			collect.httpCollector.totalDuration,
			collect.httpCollector.totalTransaction,
			collect.httpCollector.totalErrorCountHttp);
		ClientStub.collectLogValues(system,error);

		if(Object.keys(http).length){
			collect.httpCollector.collection = {};
			collect.httpCollector.hdr.reset();
			collect.httpCollector.totalDuration = 0;
			collect.httpCollector.totalTransaction = 0;
			collect.httpCollector.totalErrorCountHttp = 0;
		}
		if(Object.keys(error).length){
			collect.errorCollector.collection = {};
			collect.errorCollector.totalErrorCount = 0;
		}
		if(Object.keys(system).length){
			collect.systemCollector.collection = {};
		}
	}
}

module.exports = Harvester;