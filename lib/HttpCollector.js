var hdr = require('hdr-histogram-js');
var Config = require('./config');
var config = new Config();


function HttpCollector(){
	this.collection = {};
	this._collections = [];
	this.hdr = hdr.build();
	this.totalDuration = 0;
	this.totalTransaction = 0;
	this.totalErrorCountHttp = 0;
}

HttpCollector.prototype = {
	collect: function(txn){
		if(this.totalTransaction < config.maxTotalTransactionCount){
		//var key = txn.url + ':$:' +  txn.method + ':$:' + txn.statusCode;
		var key = txn.url + ':$:' +  txn.method;
		if(!this.collection[key]){
			this.collection[key] = {
				'count' : 0,
				'errors' : {},
				'error_count': 0,
				'externals' : {},
				'timestamp' : Date.now(),
				'url':txn.url,
				'method':txn.method,
				'status':txn.statusCode,
				'duration': 0,
				'hdr': hdr.build()
			}
		}
		this.duration(key, txn.timer.duration);
		this.count(key);
		this.externals(key, txn.externals);
		this.collection[key]['timestamp'] = Date.now();
		this.collection[key]['status'] = txn.statusCode;
		}
	},
	collectError:function(err){
		var key = err.url + ':$:' +  err.method;
		if(!this.collection[key]){
			this.collection[key] = {
				'count' : 0,
				'errors' : {},
				'error_count': 0,
				'externals' : [],
				'timestamp' : Date.now(),
				'url':err.url,
				'method':err.method,
				'status': 0,
				'duration': 0,
				'hdr': hdr.build()
			}
		}
		err.timestamp = Date.now();
		if(!this.collection[key].errors[err.status]){
			this.collection[key].errors[err.status] = []
		}
		this.collection[key].error_count++;
		this.collection[key].errors[err.status].push(err);
		this.totalErrorCountHttp++;
	},
	count: function(key){
		this.collection[key].count++;
		this.totalTransaction++;
	},
	duration: function(key, duration){
		this.collection[key].hdr.recordValue(duration);
		this.collection[key].duration = this.collection[key].duration + duration;
		this.totalDuration = this.totalDuration + duration;
		this.hdr.recordValue(duration)
	},
	externals: function(key, externals){
		var pExternals = this.collection[key].externals;
		Object.keys(externals).forEach(function(external){
			if(pExternals[external]){
				pExternals[external].time = (pExternals[external].time * pExternals[external].count +  externals[external].time)/(pExternals[external].count + externals[external].count);
				pExternals[external].count += externals[external].count;
			} else pExternals[external] = externals[external];
		});
	},
	merge: function(url, route){
		if(!route) return url;
		var routePrefix = route.split('/')[1];
		if(!routePrefix) return url;
		return url.substring(0, url.indexOf(routePrefix)-1) + route;
	}
}

module.exports = HttpCollector;
