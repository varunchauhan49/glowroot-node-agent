
var shimmer = require('shimmer');


function wrapMatchRequest(agent, matchRequest){
	var store = agent.store;
	return function(){
		var currTxn = store.get('TXN');
		if(!currTxn) return matchRequest.apply(this, arguments);	
		var route = matchRequest.apply(this, arguments);
		route && route.path && (currTxn.url = merge(currTxn.url, route.path));
		return route;
	}
}
function wrapProcessParams(agent, process_params){
	var store = agent.store;
	return function(req){
		var currTxn = store.get('TXN');
		if(!currTxn) return process_params.apply(this, arguments);
		if(arguments.length && req && req.route) currTxn.url = merge(currTxn.url, req.route.path);
		return process_params.apply(this, arguments);
	}
}

function patchRoutes(agent, express){
	if(express.Router && express.Router.prototype && express.Router.prototype.matchRequest && !express.Router.prototype.matchRequest.__wrapped){
		shimmer.wrap(express.Router.prototype, 'matchRequest', wrapMatchRequest.bind(null, agent));
	} else if (express.Router && express.Router && express.Router.process_params && !express.Router.process_params.__wrapped){
		shimmer.wrap(express.Router, 'process_params', wrapProcessParams.bind(null, agent));
	} else if (express.Router && express.Router.prototype && express.Router.prototype.process_params && !express.Router.prototype.process_params.__wrapped){
		shimmer.wrap(express.Router.prototype, 'process_params', wrapProcessParams.bind(null, agent));
	}
}

function merge(url, route){
	if(!route) return url;
	var routePrefix = '';
	if(typeof route === 'string'){
		routePrefix = route.split('/')[1];
	} else if(Array.isArray(route)){
		return route.join('|');
	}
	if(!routePrefix) return url;
	return url.substring(0, url.indexOf(routePrefix)-1) + route;
}

module.exports = function(agent, express){
	patchRoutes(agent, express);
}