var shimmer = require('shimmer');
var http = require('http');
var transaction = require('../../transaction/transaction');
var Domain = require('domain').Domain;


function incomingRequest(agent, listener){
	var store = agent.store;
	var txnManager = agent.transactionManager;
	return function(request, response){

		store.bindEmitter(request);
		store.bindEmitter(response);

		var txn = txnManager.getTransaction();
		var context = store.run(function(){
			store.set('TXN', txn);
		});

		txn.type = 'http';
		txn.url = (request.url || '').split(/[?#]/)[0];
		txn.method = request.method;
		txnManager.startTransaction(txn);
		function responseSent(){
			txn.statusCode = (response || {}).statusCode || 'na';
			if(store.get('TXN') && +txn.statusCode && +txn.statusCode > 400) {
				var error = {
					message: txn.statusCode + ' ' + (response || {}).statusMessage,
					url : txn.url,
					method : txn.method,
					stack : '',
					status: txn.statusCode
				};
				agent.emit('txn-error', error);
			}
			txnManager.stopTransaction(txn);
    	}
		response.once('finish', responseSent);
		// response.once('finish', store.bind(responseSent, context));
		
		store.bind(listener, context).apply(this, arguments);
	}
}

function externalRequest(agent, request){
	var store = agent.store;
	var txnManager = agent.transactionManager;
	return function(options){
		var opt = arguments[0] || {};
		var url = opt.host + opt.path;
		var requested;
		if(opt.host !== 'agentserver.myntra.com') {			
			var extTxn = txnManager.getTransaction();
			var parentTxn = store.get('TXN');

			if(!parentTxn) {
				parentTxn = txnManager.getTransaction();
				parentTxn.type = 'http';
				parentTxn.url = '';
				parentTxn.method = '';
				parentTxn.statusCode = '';
            }

			txnManager.startTransaction(extTxn);
			requested = request.apply(this, arguments);
			extTxn.url = opt.host || opt.hostname;
			extTxn.method = (opt.method || '').toLowerCase();
			
			requested.once('error', function handleError(error) {
				process.nextTick(function(){
					error.url = extTxn.url;
					error.method = extTxn.method;
					agent.emit('txn-error-ext', error);
				});
	    	});

			requested.on('response', function(){
				extTxn.status = ((arguments.length && arguments[0]) || {}).statusCode;
				txnManager.stopTransaction(extTxn, parentTxn);
				if(parentTxn && parentTxn.url === '') txnManager.stopTransaction(parentTxn);
			});

			store.bindEmitter(requested);
			return requested;
		} else {
			return request.apply(this, arguments);	
		}
	}
}

function patchIncomingRequests(agent){
	shimmer.wrap(http.Server.prototype, 'addListener', function(addListener) {
      return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
          return addListener.call(this, type, incomingRequest(agent, listener))
        } 
        return addListener.apply(this, arguments)
      }
    }
  )
  
  // shimmer.wrap(Domain.prototype, 'emit', function(emitter){
  // 	return function (type, _error) {
  // 		if(type === 'error') {
  // 			process.nextTick(function(){
  // 				var parentTxn = agent.store.get('TXN') || {url: 'na', method: 'na'};
  // 				_error.url = parentTxn.url;
  // 				_error.method = parentTxn.method;
  // 				agent.emit('txn-error', _error);
  // 			});
  // 		}
  // 		return emitter.apply(this, arguments);
  // 	};
  // });

}

function patchExceptions(agent){
	if (process._fatalException) {
	    shimmer.wrap(process, '_fatalException', function (original) {
	      return function (error) {
	       	var parentTxn = agent.store.get('TXN') || {url: 'na', method: 'na'};
			error.url = parentTxn.url;
			error.method = parentTxn.method;
			agent.emit('txn-error-patch', error); 
	        return original.apply(this, arguments)
	      }
	    })
  	} else {
		process.on('uncaughtException', function (error) {
			var parentTxn = agent.store.get('TXN') || {url: 'na', method: 'na'};
			error.url = parentTxn.url;
			error.method = parentTxn.method;
			agent.emit('txn-error-patch', error);
		})
	}
}

function patchExternalRequests(agent){
	var httpAgent = (http.Agent && http.Agent.prototype && http.Agent.prototype.request) 
										? http.Agent.prototype.request 
										: http;
	shimmer.wrap(httpAgent, 'request', externalRequest.bind(null, agent))
}

module.exports = function(agent){
	patchIncomingRequests(agent);
	patchExternalRequests(agent);
	patchExceptions(agent);
}