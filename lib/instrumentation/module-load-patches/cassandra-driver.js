var shimmer = require('shimmer');


function before(before, fn) {
    return function () {
        before.apply(this, arguments);
        return fn.apply(this, arguments);
    };
};

function wrapExec(agent, innerExecute) {
    var store = agent.store;
    var txnManager = agent.transactionManager;
    return function(){
        var query = (arguments[0] || '').toLowerCase();
        query = query.substring(0, query.indexOf(' where '));
        var len = arguments.length - 1;
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
        extTxn.url = query;
        extTxn.method = 'cql-query';
        arguments[len] = before(function(){
            extTxn.status = 200;
            if(arguments[0]) {
                extTxn.status = 500;
                var error = arguments[0];
                process.nextTick(function(){
                    error.url = extTxn.url;
                    error.method = extTxn.method;
                    agent.emit('txn-error', error);
                });
            } 
            txnManager.stopTransaction(extTxn, parentTxn);
            if(parentTxn && parentTxn.url === '') txnManager.stopTransaction(parentTxn);    
        }, arguments[len]);
        innerExecute.apply(this,arguments);
    }
}

function wrapBatch(agent, batch) {
    return function(){
        batch.apply(this,arguments);
    }
}

function patchExec(agent, cassandra){
    shimmer.wrap(cassandra.Client.prototype, '_innerExecute', wrapExec.bind(null, agent));
}

function patchBatch(agent, cassandra){
    shimmer.wrap(cassandra.Client.prototype, 'batch', wrapBatch.bind(null, agent));
}

module.exports = function(agent, cassandra){
    patchExec(agent, cassandra);
   // patchBatch(agent, cassandra); //Not tested
}