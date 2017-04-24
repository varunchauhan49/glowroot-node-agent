var util = require('util');
var EventEmitter = require('events').EventEmitter;
var TransactionManager = require('./transaction/transactionmanager');
var cls = require('continuation-local-storage');
var instrumentation = require('./instrumentation');
var TransactionManager = require('./transaction/transactionmanager');
var Collector = require('./Collector');
var shimmer = require('shimmer');
function Agent(){
	if (!(this instanceof Agent)) return new Agent();

	EventEmitter.call(this);
	//We are using cls(continuation local storage) for capturing flow of async transaction so as to execute function
	//wrapped with them once there execution is completed. 
	this.store = cls.createNamespace('TXN_STORE');

	this.collector = new Collector(this);
	this.transactionManager = new TransactionManager(this);
}

util.inherits(Agent, EventEmitter);

Agent.prototype.start= function(){
	// this.patchModuleLoad();
	this.collector.listen();
	instrumentation.patch(this);
}

//Here we are patching functions of app.
Agent.prototype.patchModuleLoad = function(){
	var Module = require('module')
  shimmer.wrap(Module, '_load', function(load) {
    return function(file) {
      return load.apply(this, arguments);
    }
  })
}


module.exports = Agent;