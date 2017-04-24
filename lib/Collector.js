var Harvester = require('./Harvester');
var HttpCollector =  require('./HttpCollector');
var ErrorCollector = require('./ErrorCollector');
var SystemCollector = require('./SystemCollector');
var ClientStub = require('./ClientStub');
var Config = require('./config');
var config = new Config();
var Harvester = require('./Harvester');

function Collector(agent){
	this.agent = agent;
	
	this.httpCollector = new HttpCollector();
	this.errorCollector = new ErrorCollector();
	this.systemCollector = new SystemCollector();

}

Collector.prototype = {
	http: function(){
		var data = this.httpCollector.collection
		return(data);
	},
	listen: function(){
		var self = this;
		self.agent.on('txn-completed', function(txn){
			self['httpCollector'].collect(txn);
		});
		self.agent.on('txn-error', function(err){
			self.errorCollector.collect(err);
			//console.log(err);
			self['httpCollector'].collectError(err);
		});
		self.agent.on('txn-error-ext', function(err){
			self.errorCollector.collect(err);
		});
		self.agent.on('txn-error-patch', function(err){
			self.errorCollector.collect(err);
		});
		this.harvester = new Harvester();
		this.harvester.timer(this);
	 }
}

module.exports = Collector;
