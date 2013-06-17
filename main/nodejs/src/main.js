
var url = require('url')
  , http = require('http')
  , format = require('util').format
  , htmlparser = require('htmlparser2');

var helenus = require('helenus'),
      pool = new helenus.ConnectionPool({
        hosts      : ['127.0.0.1:9160'],
        keyspace : 'tracks',
        cqlVersion : '3.0.0'
      });

var ZOOMZOOM_NDX = 0;
var LETSRIDE_NDX = 1;
var KEIGWINS_NDX = 2;
var lastupdate;
var checkdays = 1;

var sites = {
  url:["z2trackdays.com" ,"letsridetrackdays.com","keigwins.com"],
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
      if (name=="a" && attribs.href && attribs.href.indexOf("category=") > 1)
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
        if(trackname != null && trackdate != null){
          addscheduletodb(sites.name[ZOOMZOOM_NDX],trackname,new Date(Date.parse(trackdate,"DD, dd, MM, yyyy")));
        }

      }
  },
  onclosetag: function(tagname){
  }
});

var letsrideparser = new htmlparser.Parser({

  onopentag: function(name, attribs){
      if(name == "div" && attribs.class && attribs.class == "name"){
        currState = startstate;
      }
      else if (currState == startstate && name=="a" && attribs.href && attribs.href.indexOf("=com_ayelshop") > 1)
      {
        currState = datestate;
      }
  },
  ontext: function(text){
      if (currState == datestate) 
      {
        var dateAndTitle = text.split("-");
        if (dateAndTitle.length > 1) {
          trackdate = dateAndTitle[0].trim();
          trackname = dateAndTitle[1].trim();
          currState = nostate;
          // put schedules in db
          if(trackname != null && trackdate != null){
            addscheduletodb(sites.name[LETSRIDE_NDX],trackname,new Date(Date.parse(trackdate,"DD, dd, MM, yyyy")));
          }
        }

      }
  },
  onclosetag: function(tagname){
  }
});

var keigwinparser = new htmlparser.Parser({

  onopentag: function(name, attribs){
      if (name=="tr" && attribs.class && attribs.class == "datatable")
      {
        currState = startstate;
      }
      else if(currState == startstate && name == "a" && attribs.href && attribs.href.indexOf("events_roster") >= 0){
        currState = datestate;
      }
      else if(name == "td" && currState == datestate){
        currState = titlestate;
      }
  },
  ontext: function(text){
      if(currState == datestate){
        var eventdate = text.split("|");
        if(eventdate.length > 1){
          trackdate = eventdate[0].trim();
          trackdate = trackdate + " 2013";
        }
        
      }
      else if (currState == titlestate) 
      {
        trackname = text;
        currState = nostate; 

        // put schedules in db
        if(trackname != null && trackdate != null){
          addscheduletodb(sites.name[KEIGWINS_NDX],trackname,new Date(Date.parse(trackdate,"MM dd yyyy")));
        }

      }
  },
  onclosetag: function(tagname){
  }
});



function addscheduletodb(club, trackname, trackdate) {

  pool.connect(function(err, keyspace){
      if(err){
        throw(err);
      } 
 
      //keyspace.get('schedules', function(err, cf){
      //  if (err) {
      //    throw(err);
       // }

      //  cf.insert(club, {'name':club,'track':trackname,'groups':'','cost':'','services':'','notes':'','date':trackdate}, function(err){
       //   if (err) {
       //     throw(err);
       //   }
       // });

      //});
      console.log('inserting club = ' + club);
      pool.cql("INSERT INTO schedules (name, track,date) VALUES(?,?,?)", [club,trackname,''+ trackdate]);
    });
}

pool.on('error', function(err){
    console.error(err.name, err.message);
  });

function resetdb(){

}

function getschedulefromdb(res){
  pool.connect(function(err, keyspace){
    if(err){
      throw(err);
    } else {

      pool.cql("SELECT * FROM schedules", function(err, results){
        if(err){
          throw(err);
        }
        results.forEach(function(row){
          //gets the column with the name 'foo' of each row
          console.log(row.get('name'));
          res.write(row.get('name').value);
          //res.write(row.get('track'));
          //res.write(row.get('groups'));
          //res.write(row.get('cost'));
          //res.write(row.get('services'));
          //res.write(row.get('notes'));
          //res.write(row.get('date'));
        });
        res.end();
        //res.end(JSON.stringify(docs));
      });

    }
  });
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
    break;

    case LETSRIDE_NDX:
      letsrideparser.write(data);
      letsrideparser.end();
    break;
    case KEIGWINS_NDX:
      keigwinparser.write(data);
      keigwinparser.end();
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

    resetdb();

    // Should look up list of uri's from couch db
    // iterate over uri's and retrieve schedules
    for (var i = sites.url.length - 1; i >= 0; i--) {
      updateschedulefromsite(sites.url[i], sites.path[i], i);
    };

    lastupdate = new Date();
  }

  res.end();
  //getschedulefromdb(res);

}

function pinggae(result) {
  http.get({ host: 'pytrackdays.appspot.com', path: '/update', }, function(res) {

    res.on('data', function(d) {
        process.stdout.write(d);
        result.end();
    });

  }).on('error', function(e) {
      console.error(e);
    });  
}

//commands:
//  refresh ; gettracks; pingback
http.createServer(function(req,res) {
  res.writeHead(200, {'Content-Type':'application/json'});
  var query = url.parse(req.url).query;
  if(req.url == "/refresh")
  {
    getallschedulesfromsites(res);
  }
  else if(req.url == "/gettracks")
  {
    getschedulefromdb(res);
  }
  else if(req.url == "/pingback")
  {
    pinggae(res);
  }


}).listen(8080)
console.log('Server running at 8080');