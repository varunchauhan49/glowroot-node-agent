# NodeAgent #

Install this module to instrument your node js app. Metrics will be pushed to the location specified by gRPC client.
`let client = new collectorService.CollectorService('localhost:8181',
                                          grpc.credentials.createInsecure());`

### Installation ###

#Git Clone
   `git clone git@github.com:varunchauhan49/myntnodeagent.git`

#Add the following code to your server.js
   `if(process.env.NODE_ENV === 'production'){ 
    require('myntnodeagent');
   }`

#Add add an environment variable NODE_AGENT_APPS with application name
  `Application name should be same as which is in package.json.`   
  `For eg: NODE_AGENT_APPS=appname1,appname2,appname3`

####NODE AGENT will only start if it founds the application name in the environment variable####

### Monitoring ###

If you are running glowroot server locally then you can go to `localhost:4000` to, monitor your application.
https://github.com/glowroot/glowroot
