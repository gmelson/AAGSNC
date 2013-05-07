
var url = require('url')
  , http = require('http')
  , MongoClient = require('mongodb').MongoClient
  , format = require('util').format
  , htmlparser = require('htmlparser2');

var mongourl = 'mongodb://track:trackdays@127.0.0.1:27017/schedule'
var ZOOMZOOM_NDX = 0;
var LETSRIDE_NDX = 1;
var KEIGWINS_NDX = 2;
var lastupdate;
var checkdays = 1;

var sites = {
  url:["z2trackdays.com"],//,"letsridetrackdays.com","keigwins.com"],
  path:["/ti/z2/content/calendar.html","/index.php?option=com_ayelshop&view=category&path=34&Itemid=41","/events_schedule.php"],
  name:["Zoom Zoom","Let\'s Ride","Keigwins"]
};

var nostate = 0;
var startstate = 1;
var titlestate = 2;
var datestate = 3;


var currState = "none";
var trackname = "";
var trackdate = "";

var zoomparser = new htmlparser.Parser({

  onopentag: function(name, attribs){
      if (name=="a" && attribs.href.indexOf("category=") > 1)
      {
        currState = startstate;
      }
      else if(name == "h1" && currState == startstate){
        currState = titlestate;
      }
  },
  ontext: function(text){
      if(currState == titlestate){
        trackname = text;
        currState = datestate;
      }
      else if (currState == datestate) 
      {
        trackdate = text;
        currState = nostate; 

        // put schedules in db
        addscheduletodb("Zoom Zoom",trackname,trackdate);

      }
  },
  onclosetag: function(tagname){
  }
});

function addscheduletodb(club, trackname, trackdate) {

  var schedule = {name: club, track: trackname, groups: "", cost:"", services:"", notes: "", date: trackdate};

  MongoClient.connect(mongourl, function(err, db){
    
    if(err) throw err;

    db.createCollection("schedule", function(err, collection){
      if (err) throw err;

      collection.insert(schedule, function(err, records){
        if(err) throw err;
      });
    });
  });
}

function getschedulefromdb(res){
  MongoClient.connect(mongourl, function(err, db){
    db.createCollection("schedule", function(err,collection){
      collection.find().each(function(err, doc){
        if(null != doc) res.write(doc);//console.dir(doc);
        //res.end(docs, 'utf8');
      });
    });
  });
  res.end();
}

function needscheduleupdate(){
  var days = 0;
  now = new Date();
  if(lastupdate != undefined){
    var timeDiff = lastupdate.getTime() - now.getTime();

    // strip the miliseconds
    timeDiff /= 1000;

    // get seconds
    var seconds = Math.round(timeDiff % 60);

    // remove seconds from the date
    timeDiff /= Math.round(60);


    // remove minutes from the date
    timeDiff /= Math.round(60);

    // remove hours from the date
    timeDiff /= Math.round(24);

    // the rest of timeDiff is number of days
    days = timeDiff ;
  }
  else {
    days = 1;
  }

  return (days >= checkdays) ? true : false;

}

function parsedomfor(data, sitendx) {
  switch(sitendx){
    case ZOOMZOOM_NDX:
      zoomparser.write(data);
      zoomparser.end();
      //res.end(trackname +  " " + trackdate , "utf8");
    //html body center div#container div#main-body div#content-right div.t2013 div.t2013Header a div.t2013Name (text)
    break;

    case KEIGWINS_NDX:
      //html->body->div#wrapper->div#contentContainer->div->div#contentBox->table.datatable->tbody->tr.datable->td->table->tbody->tr->td->a
      break;
  }

}

function updateschedulefromsite(backendhost, schedulepath, sitendx){

	http.get({ host: backendhost, path: schedulepath, }, function(res) {

  		res.on('data', function(d) {
        process.stdout.write(d);
        parsedomfor(d, sitendx);
		});

	}).on('error', function(e) {
  		console.error(e);
		});

}

function getallschedulesfromsites(res) {

  // Check last update time to determine if we need schedule refresh 
  if (needscheduleupdate()){
      
    // Should look up list of uri's from couch db
    // iterate over uri's and retrieve schedules
    for (var i = sites.url.length - 1; i >= 0; i--) {
       updateschedulefromsite(sites.url[i], sites.path[i], i);
    };
  }

  getschedulefromdb(res);

}


http.createServer(function(req,res) {
  res.writeHead(200, {'Content-Type':'text/plain'});
  var query = url.parse(req.url).query;
  getallschedulesfromsites(res);
  res.end('hit','utf8');
}).listen(8380)
console.log('Server running at 8380');