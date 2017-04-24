var os = require('os');
var hostname = os.hostname();
var type = os.type();
var totalmem = os.totalmem();
var cpus = os.cpus();
var cpuModel = cpus[0].model;
var cpuSpeed = cpus[0].speed;
var cpuCore = cpus.length;

function SystemCollector(){
	this.collection = {};
	this._collections = [];
}

//System Collector is used to collect all system related information using system level node API's.
SystemCollector.prototype = {
	collect : function(){
		var memoryUsage = process.memoryUsage();
		var heap = memoryUsage.heapUsed / memoryUsage.heapTotal;
		this.collection = {
			host: hostname,
			type: type,
			uptime: os.uptime(),
			loadavg: os.loadavg(),
			totalmem: totalmem,
			freemem: os.freemem(),
			cpuModel: cpuModel,
			cpuSpeed: cpuSpeed,
			cpuCore: cpuCore,
			rss : memoryUsage.rss,
			heap: heap,
			timestamp: Date.now()
		}
	}
}

module.exports = SystemCollector;