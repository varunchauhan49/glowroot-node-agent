var Agent;
var appname;
var cwd = process.cwd();
if(cwd) {
	appname = require(cwd + '/package.json').name;
}

var apps = process.env.NODE_AGENT_APPS;
function printDoc(){
	console.log('******************************************************************');
	console.log('* Not starting node agent. Appname not found in NODE_AGENT_APPS  *');
	console.log('* If you want to add this app to nodeagent please add            *');
	console.log('* an environment variable NODE_AGENT_APPS with application name. *');
	console.log('* Application name should be same as which is in package.json.   *');
	console.log('* For eg: NODE_AGENT_APPS=appname1,appname2,appname3             *');
	console.log('******************************************************************');
	console.log('process.env.NODE_AGENT_APPS=' + process.env.NODE_AGENT_APPS);
}



if(apps) {
	apps = apps.split(',');
	if(apps.indexOf(appname) !== -1) {
		Agent = require('./lib/agent')();
		Agent.start();
	} else {
		printDoc();
	}
} else {
	printDoc();
}

