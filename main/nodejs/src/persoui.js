var url = require('url')
  , http = require('http');

var querystring = require('querystring'); 


var Connection = require('cassandra-client').Connection;
var con = new Connection({host:'192.168.155.130', port:9160, keyspace:'test_sequent_sptsm', cql_version: '2.0.0'});
con.connect(function(err, con) {
  if (err) {
    // Failed to establish connection.
    console.log('error connecting');

    throw err;
  }

  con.execute('SELECT ? FROM card_info',['jsondata'], function(err, row) {
      if (err) {
	  	console.log('error with select');
      } else {
          // handle success.
          row.forEach(function(col){
          	console.log('value =' + col.value);
          });
      }
  });
});


http.createServer(function(req,res) {
  res.writeHead(200, {'Content-Type':'application/json'});
  var query = url.parse(req.url).query;
	  


}).listen(8380)
console.log('Server running at 8380');