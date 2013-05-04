
var url = require('url')
  , http = require('http')
  , MongoClient = require('mongodb').MongoClient
  , format = require('util').format;

var mongourl = '127.0.0.1';
var KEIGWINS_NDX = 0;
var PTT_NDX = 1;
var LETSRIDE_NDX = 2;

var sites = {
  urls:[],
  names:[],

};

function addscheduletodb(schedule) {
  MongoClient.connect(mongourl, function(err, db){
    
    if(err) throw err;
    console.log("Connected to Database");

    db.createCollection("schedule", function(err, collection){
      if (err) throw err;
      console.log("Created collection");

      collection.insert(schedule, function(err, records){
        if(err) throw err;

        console.log("Record added as " + records[0]._id);

      });
    });
  });
}

function getschedulefromdb(){
  MongoClient.connect(mongourl, function(err, db){
    db.createCollection("schedule", function(err,collection){
      collection.find().toArray(function(err, docs){
        console.log(docs);
      });
    });
  });
}

function parsedomfor(sitendx, data) {
  switch(sitendx){

  }
  //Keigwins
  //html->body->div#wrapper->div#contentContainer->div->div#contentBox->table.datatable->tbody->tr.datable->td->table->tbody->tr->td->a
}

function getschedulefromsite(backendhost, schedulepath){

	http.get({ host: backendhost, path: schedulepath, }, function(res) {
  		console.log("statusCode: ", res.statusCode);
  		console.log("headers: ", res.headers);
		
  		res.on('data', function(d) {
    			process.stdout.write(d);
          return d;
		});

	}).on('error', function(e) {
  		console.error(e);
		});

}

function getallschedulesfromsites(res) {

  // Check last update time to determine if we need schedule refresh 

  // Should look up list of uri's from couch db

  // iterate over uri's and retrieve schedules
  

  // put schedules in db
  Date track groups cost services notes registrationUri
  var schedule = {name: "", track: "", groups: "", cost:"", services:"", notes: ""};
}


http.createServer(function(req,res) {
  res.writeHead(200, {'Content-Type':'text/plain'});
  var query = url.parse(req.url).query;
  res.end('hit','utf8');
}).listen(8080)
console.log('Server running at 8080');