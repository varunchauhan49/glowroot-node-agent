require('myntnodeagent');


var express = require('express');
var app = express();
var path = require('path');
var mysql      = require('mysql');

// Add the route
app.get('/api/search/test1',function(req, res){
  //res.statusCode = 401;
  return res.send("Done");
})

app.get('/fetch', function (req, res) {
  var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'apm',
  password : 'myntapm',
  database : 'apm'
  });
  connection.connect();

  connection.query('SELECT * from apm.apmlist AS solution where id>2', function (error, results, fields) {
    if (error) throw error;
    res.json(results);
  });

  connection.end();
})

app.get('/api/get/getpool', function (req, res) {
  var pool = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'apm',
  password : 'myntapm',
  database : 'apm'
  });
  
  pool.getConnection(function(err, connection) {
    
    // Use the connection
    connection.query('SELECT * from apm.apmlist AS solution where id>2', function (error, results, fields) {
      // And done with the connection.
      connection.release();

      // Handle error after the release.
      if (error) throw error;
      res.json(results);
      // Don't use the connection here, it has been returned to the pool.
    });
  });

})

app.get('/api/get/pool', function (req, res) {
  var pool = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'apm',
  password : 'myntapm',
  database : 'apm'
  });
  
  pool.query('SELECT * from apm.apmlist AS solution where id>2', function (error, results, fields) {
    if (error) throw error;
    res.json(results);
  });

})

// Add the route
app.get('/api/search/test2',function(req, res){
  return res.send("Done");
})

// Add the route
app.get('/api/search/test3',function(req, res){
  //res.statusCode = 410;
  res.status(404).send('Not found');
})

// Add the route
app.get('/api/search/test4',function(req, res){
  return res.send("Done");
})
// Add the route
app.get('/api/search/test5',function(req, res){
      //res.statusCode = 408;
  res.status(408).send('Request Timeout');
})

// Add the route
app.get('/api/search/test6',function(req, res){
  return res.send("Done");
})


//Start Server
var server = app.listen('8000',function(){
    console.log('Server Running on port',server.address().port);
});
