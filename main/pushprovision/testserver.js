var url = require('url')
    , http = require('http');

//  refresh ; gettracks; pingback
http.createServer(function(req,res) {
    res.writeHead(200, {'Content-Type':'application/json'});
    var query = url.parse(req.url).query;
    console.log(req);

}).listen(8380)
console.log('Server running at 8380');