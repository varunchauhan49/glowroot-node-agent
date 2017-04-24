var logger = require('../logger');
var Transaction = require('./transaction');

function TransactionManager(agent){
	this.agent = agent;
}

TransactionManager.prototype = {
	getTransaction: function(){
		return new Transaction();
	},
	startTransaction: function(txn){
		txn.start();
	},
	stopTransaction: function(txn, parent){
		var self = this;
		txn.stop();
		if(parent){
			parent.addExternals(txn);
		} else {
			if(!txn.isProcessed && txn.isStopped){
				txn.isProcessed = true;
				process.nextTick(function(){
					self.agent.emit('txn-completed', txn);
				});	
			}
		}
	}
}

module.exports = TransactionManager;