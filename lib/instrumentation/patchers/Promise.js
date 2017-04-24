var shimmer = require('shimmer');

function patchPromise(ns, Promise) {
  shimmer.wrap(Promise.prototype, 'then', function(then) {
    return function(onSuccess, onRejection) {

      if (typeof onSuccess === 'function') {
        onSuccess = ns.bind(onSuccess);
      }

      if (typeof onRejection === 'function') {
        onRejection = ns.bind(onRejection);
      }

      return then.call(this, onSuccess, onRejection);
    };
  });
};

module.exports = function(agent){
    (typeof Promise !== 'undefined') && patchPromise(agent.store, Promise);
}