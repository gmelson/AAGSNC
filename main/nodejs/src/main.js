
var url = require('url')
  , http = require('http')


function getschedule(backendhost, schedulepath){

	http.get({ host: backendhost, path: schedulepath, }, function(res) {
  		console.log("statusCode: ", res.statusCode);
  		console.log("headers: ", res.headers);
		
  		res.on('data', function(d) {
    			process.stdout.write(d);

		});

	}).on('error', function(e) {
  		console.error(e);
		});


}

function getallschedules(res) {

  // Check last update time to determine if we need schedule refresh 

  // Should look up list of uri's from couch db

  // iterate over uri's and retrieve schedules
  // put schedules in db
}
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  getallschedules(res);
}).listen(1337, "localhost")
console.log('Server running at http://127.0.0.1:1337/');
