const uuidV1 = require('uuid/v1');
var timer = require('./timer');
var properties = require('./properties');
var logger = require('../logger');

function Transaction(config){
	this.id = uuidV1();
	this.timer = new timer();
	this.isExternal = false;
	this.externals = {};
	this.isOrphan = false;
	this.isStopped = false;
	this.isProcessed = false;
}

Transaction.prototype = {
	getId: function(){
		return this.id;
	},
	setType: function(type){
		this.type = type;
	},
	start: function(){
		this.timer.start();
	},
	stop: function(){
		this.timer.end();
		this.isStopped = true;
	},
	duration: function(){
		return this.timer.getDuration();
	},
	addExternals: function(txn){
		var key = txn.url + ':$:' + txn.method + ':$:' + txn.status;
		if(this.externals[key]){
			this.externals[key].count++;
			this.externals[key].time = this.externals[key].time + txn.timer.duration;
		} else {
			this.externals[key] = {
				url: txn.url,
				method: txn.method,
				count : 1,
				time : txn.timer.duration,
				status: txn.status
			}
		}
	}
}

module.exports = Transaction;