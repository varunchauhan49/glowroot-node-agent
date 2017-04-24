var shimmer = require('shimmer');


function before(before, fn) {
    return function () {
        before.apply(this, arguments);
        return fn.apply(this, arguments);
    };
};

function wrapExec(agent, createQuery) {
    var store = agent.store;
    var txnManager = agent.transactionManager;
    return function(){
        if(arguments.length === 1){
            createQuery.apply(this,arguments);
            return
        }
        var query = (arguments[0] || '').toLowerCase();
        query = query.split('where')[0];
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
        extTxn.method = 'sql-query';
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
        createQuery.apply(this,arguments);
    }
}


function patchExec(agent, mysql){
    //Wrapping Connection.query function to SQL query for normal connection Type.
    shimmer.wrap(
      mysql,
      'createConnection',
      function cb_wrapMethod(createConnection) {
        return function wrappedCreateConnection() {
          var connection = createConnection.apply(this, arguments)
          shimmer.wrap(connection, 'query', wrapExec.bind(null, agent));
          return connection
        }
      }
    )
    //Wrapping query function for Pooling connections. Pool.Query
    shimmer.wrap(
      mysql,
      'createPool',
      function cb_wrapMethod(createPool) {
        return function wrappedCreatePool() {
          var connection = createPool.apply(this, arguments)
          shimmer.wrap(connection, 'query', wrapExec.bind(null, agent));
          return connection
        }
      }
    )

    shimmer.wrap(mysql,'createPool',
      function cb_wrapMethodpool(createPool) {
        return function wrappedCreatePoolSingle() {
          var pool = createPool.apply(this, arguments)
          shimmer.wrap(pool, 'getConnection',
            function cb_wrapMethod(getConnection) {
                return function() {
                   arguments[0] = before(function () {
                     shimmer.wrap(arguments[1], 'query', wrapExec.bind(null, agent));
                  },arguments[0]);
                  getConnection.apply(this, arguments)
                }
            })
          return pool
        }
      }
    )
}


module.exports = function(agent, mysql){
    patchExec(agent, mysql);
}