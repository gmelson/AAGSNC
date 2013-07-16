
var url = require('url')
  , http = require('http')
  , format = require('util').format
  , htmlparser = require('htmlparser2');

var querystring = require('querystring'); 
var helenus = require('helenus'),
      pool = new helenus.ConnectionPool({
        hosts      : ['127.0.0.1:9160'],
        keyspace : 'tracks',
        cqlVersion : '3.0.0'
      });

var ZOOMZOOM_NDX = 0;
var LETSRIDE_NDX = 1;
var KEIGWINS_NDX = 2;
var PTT_NDX = 3;
var lastupdate;
var checkdays = 1;

var sites = {
  url:["z2trackdays.com" ,"letsridetrackdays.com","keigwins.com","pacifictracktime.com"],
  path:["/ti/z2/content/calendar.html","/index.php?option=com_ayelshop&view=category&path=34&Itemid=41","/events_schedule.php","/index.php/component/com_eventbooking/Itemid,197/category_id,1/view,category/"],
  name:["Zoom Zoom","Let\'s Ride","Keigwins","Pacific Track Time"]
};

var nostate = 0;
var startstate = 1;
var titlestate = 2;
var datestate = 3;
var moneystate = 4;
var groupstate = 5;
var transitionstate = -1;

var states = [];

function getMyState(key){
  var retVal = null;

  if(states.length > 1){
    for (var i = states.length - 1; i >= 0; i--) {
      if(states[i].key == key){
        retVal = states[i];
      }
    };
  }
  return retVal;
}

function nextState(_key, _next){
  console.log('\nnextState = ' + _next + ' for key = ' + _key);

  var mystate = getMyState(_key);
  if(mystate != null){
    mystate.currState = _next;
  }
  else{
    states.push({key: _key, currState: _next, trackname: "",trackdate: "", trackcost: "", groups: ""})
  }
}

function resetState(key){
  console.log('\nresetState for key = ' + key);

  var _state = getMyState(key);
  _state.currState = nostate;
  _state.trackname = "";
  _state.trackdate = "";
  _state.trackcost = "";
  _state.groups = "";
}

function isState(__state, checkValue) {
  var retVal = false;
  if(__state && __state.currState == checkValue) {
    retVal = true;
  }
  return retVal;
}

var zoomparser = new htmlparser.Parser({

  onopentag: function(name, attribs){
      var _state = getMyState(ZOOMZOOM_NDX);

      if (name=="a" && attribs.href && attribs.href.indexOf("category=") > 1)
      {
        nextState(ZOOMZOOM_NDX, startstate);
      }
      else if(name == "h1" && isState(_state, startstate)) {
        nextState(ZOOMZOOM_NDX, titlestate);
      }
      else if (name == "div" && attribs.class=="t2013ItemPrice" ){
        nextState(ZOOMZOOM_NDX, moneystate);
      }
  },
  ontext: function(text){
      var _state = getMyState(ZOOMZOOM_NDX);
      if(isState(_state, titlestate)){
        _state.trackname = text.trim();
        _state.currState = datestate; //Hack
      }
      else if (isState(_state, datestate) ){
        _state.trackdate = text.trim();
        _state.currState = nostate; //Another hack
      }
      else if(isState(_state, moneystate)){
        _state.trackcost = text.trim();

        // put schedules in db
        if(_state.trackname != null && _state.trackdate != null){
          addscheduletodb(sites.name[_state.key],_state.trackname,new Date(Date.parse(_state.trackdate,"DD, dd, MM, yyyy")), _state.trackcost);
          resetState(ZOOMZOOM_NDX);
        }

      }
  },
  onclosetag: function(tagname){
    
  }
});

var letsrideparser = new htmlparser.Parser({

  onopentag: function(name, attribs){
      var _state  = getMyState(LETSRIDE_NDX);

      if(null == _state) nextState(LETSRIDE_NDX, nostate);

      if(isState(_state, nostate) && name == "div" && attribs.class && attribs.class == "name"){
        nextState(LETSRIDE_NDX, startstate);
      }
      else if (isState(_state,startstate) && name=="a" && attribs.href && attribs.href.indexOf("=com_ayelshop") > 1)
      {
        nextState(LETSRIDE_NDX, datestate);
      }
      else if( isState(_state, transitionstate) && attribs.class && attribs.class == "price"){
        nextState(LETSRIDE_NDX, moneystate);
      }
  },
  ontext: function(text){
    var _state  = getMyState(LETSRIDE_NDX);
      if (isState(_state, datestate)) 
      {
        var dateAndTitle = text.split("-");
        if (dateAndTitle.length > 1) {
          _state.trackdate = dateAndTitle[0].trim();
          _state.trackname = dateAndTitle[1].trim();
      
          _state.currState = transitionstate;
        }

      }
      else if(isState(_state, moneystate)){
        _state.trackcost = text.trim();

          // put schedules in db
        if(_state.trackname != null && _state.trackdate != null){
          addscheduletodb(sites.name[_state.key],_state.trackname,new Date(Date.parse(_state.trackdate,"MM/dd/yyyy")), _state.trackcost);
          resetState(LETSRIDE_NDX);
        }        
      }

  },
  onclosetag: function(tagname){
  }
});

var keigwinparser = new htmlparser.Parser({

  onopentag: function(name, attribs){
      var _state  = getMyState(KEIGWINS_NDX);

      if (name=="tr" && attribs.class && attribs.class == "datatable")
      {
        nextState(KEIGWINS_NDX, startstate);
      }
      else if(isState(_state, startstate) && name == "a" && attribs.href && attribs.href.indexOf("events_roster") >= 0){
        nextState(KEIGWINS_NDX, datestate);
      }
      else if(name == "td" && isState(_state, datestate)){
        nextState(KEIGWINS_NDX, titlestate);
      }
      else if(name == "td" && isState(_state, titlestate)){
        nextState(KEIGWINS_NDX, groupstate);
      }
      else if(name == "td" && isState(_state, groupstate)){
        nextState(KEIGWINS_NDX, moneystate);
      }


  },
  ontext: function(text){

      var _state  = getMyState(KEIGWINS_NDX);

      if(isState(_state,datestate)){
        var eventdate = text.split("|");
        if(eventdate.length > 1){
          _state.trackdate = eventdate[0].trim();
          _state.trackdate = _state.trackdate + " 2013";
        }
        
      }
      else if (isState(_state,titlestate) && _state.trackname == "" )
      {
        _state.trackname = text;

      }
      else if(isState(_state, groupstate))
      {
        _state.groups = text;
      }
      else if(isState(_state, moneystate))
      {
        _state.trackcost = text.trim();
        // put schedules in db
        if(_state.trackname != null && _state.trackdate != null){
          addscheduletodb(sites.name[_state.key],_state.trackname,new Date(Date.parse(_state.trackdate,"MM dd yyyy")), _state.trackcost);
          resetState(KEIGWINS_NDX);
        }

      }
  },
  onclosetag: function(tagname){
  }
});

var pttparser = new htmlparser.Parser({

  onopentag: function(name, attribs){
      var _state  = getMyState(PTT_NDX);

      if (name=="h1" && attribs.class && attribs.class == "eb_title")
      {
        nextState(PTT_NDX, startstate);
      }
      else if(isState(_state ,startstate) && name == "a"){
        nextState(PTT_NDX,titlestate);
      }

      else if(isState(_state,nostate) && attribs.class && attribs.class == "eb_props_price"){
        nextState(PTT_NDX,moneystate);
      }
  },
  ontext: function(text){
      var _state  = getMyState(PTT_NDX);

      if(isState(_state,titlestate)){
        var nameanddate = text.split(' ');
        if(nameanddate.length >1){
          _state.trackname = nameanddate[0].trim();
          _state.trackdate = nameanddate[1].trim();
          _state.currState = nostate;
        }
        
      }

      if(isState(_state ,moneystate)){
        _state.trackcost = text.trim();
        // put schedules in db
        if(_state.trackname != null && _state.trackdate != null){
          addscheduletodb(sites.name[_state.key],_state.trackname,new Date(Date.parse(_state.trackdate,"MM/dd/yyyy")), _state.trackcost);
          resetState(PTT_NDX);
        }

      }
  },
  onclosetag: function(tagname){
  }
});



function addscheduletodb(club, name, date, cost) {

  pool.connect(function(err, keyspace){
      if(err){
        console.log('\nerror inserting');
        throw(err);
      }  
      console.log('\ninserting club = ' + club + ' price = ' + cost);
      pool.cql("INSERT INTO schedules (name, track,date,cost) VALUES(?,?,?,?)", [club, name,''+ date, cost]);

    });
}

pool.on('error', function(err){
    console.error(err.name, err.message);
  });

function resetdb(){

}

var arrayOfSchedules = [];

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
          var _name = row.get('name').value;
          var _track = row.get('track').value;
          var _groups = row.get('groups').value;
          var _cost = row.get('cost').value;
          var _services = row.get('services').value;
          var _notes  = row.get('notes').value;
          var _date = row.get('date').value;
          arrayOfSchedules.push({name: _name, track: _track, date: _date, groups: _groups, cost: _cost, services: _services, notes: _notes});
        });

        pushtogae(res, JSON.stringify(arrayOfSchedules));
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

  //return (days >= checkdays) ? true : false;
  return true;

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
    case PTT_NDX:
      pttparser.write(data);
      pttparser.end();
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

function pushtogae(result, jsonString) {

  var post_options = {  
    host: 'pytrackdays.appspot.com',  
    port: 80,  
    path: '/update',  
    method: 'POST',  
    headers: {  
      'Content-Type': 'application/json',
      'Content-Length' : jsonString.length
    }  
  };  
    
  var post_req = http.request(post_options, function(res) {  
    res.setEncoding('utf8');  
    res.on('data', function (chunk) {  
      console.log('Response: ' + chunk);  
    });  
  });
  post_req.write(jsonString);  
  post_req.end();
  result.end('update complete');
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
  else if(req.url == "/update")
  {
    getschedulefromdb(res);
  }
  else if(req.url == "/pingback")
  {
    pinggae(res);
  }


}).listen(8380)
console.log('Server running at 8380');