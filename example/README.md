# NodeAgent Example #

Git clone the example and install node modules.

`npm install`

Npm install will install all dependency including Nodeagent. Start example app using npm start.

#Add add an environment variable NODE_AGENT_APPS with application name
  `Application name should be same as which is in package.json.`   
  `For eg: NODE_AGENT_APPS=example

####NODE AGENT will only start if it founds the application name in the environment variable####

### Monitoring ###

If you are running glowroot server locally then you can go to `localhost:4000` to, monitor your application.

For Glowroot refer to glowroot project https://github.com/glowroot/glowroot

### Traffic ###
To get live traffic on example app we have script file `url.txt` and to generate test traffic run the script on different terminal
tab using below command

`sh url.txt`