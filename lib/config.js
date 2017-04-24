'use strict'

function Config(){
	//Name of application
	this.appName = ''
	//Setting duration of Harvest cycle. Which means after how much amount of time next tick should occur. In 15000 means 15 sec.
	this.durationHarvestCycle = 15000;
	//Maxinum number of unique transaction
	this.maxUniqueTransactions = 100;
	//Maximum number of total transaction count
	this.maxTotalTransactionCount = 100000
	//Maximum number of unique errors
	this.maxUniqueErrors = 1000;
	//Maximum total error count
	this.maxTotalErrorCount = 1000;
	//Interval for Sampling
	this.samplingInterval = 0;
	// host to which data will be send via gRPC 
	this.host = 'localhost';
	// Port number on which communication will occur
	this.port = 8181;
	// Flag to enable or disable Agent
	this.agentEnabled = true;
}

module.exports = Config;