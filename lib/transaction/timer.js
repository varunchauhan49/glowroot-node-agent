//In this module we care calculating duration of a transaction and converting into nano-seconds.
function Timer(){
	this.startTime = "";
	this.duration = "";
	this.endTime = "";
}

Timer.prototype = {
	start: function(){
		this.startTime = process.hrtime();
	},
	end: function(){
		var self = this;
		this.endTime = process.hrtime(this.startTime || process.hrtime());
		this.duration = this.endTime[0] * 1e9 + this.endTime[1]; 
	},
	getDuration: function(){
		return this.duration;
	}
}

module.exports = Timer;