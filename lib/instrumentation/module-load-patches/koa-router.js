
var shimmer = require('shimmer');

function wrapMatchRequest(agent, matchRequest){
	var store = agent.store;
	return function(path, method){
		var currTxn = store.get('TXN');
		if(!currTxn) return matchRequest.apply(this, arguments);	
		var route = matchRequest.apply(this, arguments);
		var _route = route.path;
		if(_route && _route.length){
			currTxn.url = merge(currTxn.url, _route[_route.length - 1].path)
		}
		return route;
	}
}

function merge(url, route){
	if(!route) return url;
	var routePrefix = route.split('/')[1];
	if(!routePrefix) return url;
	return url.substring(0, url.indexOf(routePrefix)-1) + route;
}


function patchRoutes(agent, Router){
	if(Router && Router.prototype && Router.prototype.match && !Router.prototype.match.__wrapped){
		shimmer.wrap(Router.prototype, 'match', wrapMatchRequest.bind(null, agent));
	}
}

module.exports = function(agent, koaRouter){
	patchRoutes(agent, koaRouter);
}