function ErrorCollector(){
	this._collections = [];
	this.collection = {};
	this.totalErrorCount = 0;
}
//Error collector will collect all errors related data
ErrorCollector.prototype = {
	collect: function(error){
		var key = error.message + ':$:' + error.stack + ':$:' + error.url + ':$:' + error.method;
		this.totalErrorCount++;
		if(!this.collection[key]) {
			this.collection[key] = {
				count: 1,
				timestamp: Date.now(),
				method: error.method,
				url: error.url,
				message: error.message,
				details: error.stack
			}
		} else {
			this.collection[key].count++;
			this.collection[key].timestamp = Date.now();
		}
	}
}

module.exports = ErrorCollector;