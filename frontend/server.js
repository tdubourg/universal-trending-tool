var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;

http.createServer(function(request, response) {

  console.log("request URL is: " + request.url);
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

	if(request.url == "/GetSite"){
	
	
		response.writeHead(200, {"Content-Type": "text/plain"});
		response.write("GetSite aufgerufen!\n" + " " + request.body );
		response.end();
	}
	

	
  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript"
  };

  path.exists(filename, function(exists) {
    if(!exists) {
	
		var sqlite3 = require('sqlite3');
		var dbPath = "database.db";
		fs.exists(dbPath, function(exists) {
			if(exists) {
				console.log("bin da");
			} else {
				console.log("datei nicht da");
			}
		}
		);

		
	var jsonResponse =  [ 
		{
			"key": "Cumulative Return",
			"values": []
		}
	]
		
	var db = new sqlite3.Database(dbPath);
	
	var stmt = "SELECT page, score FROM result";
	db.each(stmt, function(err, row) {
		console.log(row.PAGE + ": " + row.SCORE);
		
		d = {}
		d[row.PAGE] = row.SCORE;
		
		jsonResponse[0].values.push(d); 
		
	  	
	}, function(err,rows) {
		 response.writeHead(200, {"Content-Type": "application/json"});
		 response.write(JSON.stringify(jsonResponse));
		 response.end();
	
	});
  


      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      var headers = {};
      var contentType = contentTypesByExtension[path.extname(filename)];
      if (contentType) headers["Content-Type"] = contentType;
      response.writeHead(200, headers);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(port, 10));





console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");