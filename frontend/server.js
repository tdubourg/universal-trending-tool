var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;
var qs = require('querystring');
var sqlite3 = require('sqlite3');	
var dbPath = "database.db";
var db = new sqlite3.Database(dbPath);
var externalrequest = require('request');

http.createServer(function(request, response) {

  console.log("request URL is: " + request.url);
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);
	
	var data = '';
	
	if(request.method === "POST") {
		request.addListener("data", function(postDataChunk) {
			data += postDataChunk;
			//console.log("Received POST data chunk '"+ postDataChunk + "'.");
			console.log("POST data sent");
		});
	}
	
	request.addListener("end", function() {
		if(request.url == "/GetSite"){
			response.writeHead(200, {"Content-Type": "text/plain"});
			data = qs.parse(data)
			//Form parameters
			response.write("GetSite called!\n" + "DATA_TO_MATCH" + data.data  + "Project: " + data.project + "\nUrl: " + data.url + "\nPattern: " + data.pattern + "\nLimit: " + data.limit);
			
			//Get Webpage
			console.log("Making request to " + data.url );
				externalrequest(data.url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var fs = require('fs');
				var stmt = db.prepare("INSERT INTO SEARCH(DATA_TO_MATCH, HTML_LEARNING_DATA, URL, NAME, PATTERN) VALUES(?,?,?,?,?)");
				stmt.run(data.data, body, data.url, data.project, data.pattern); 
				stmt.finalize();
				fs.writeFile(__dirname + "/tmp/" + data.project, body, function(err) {
					if(err) {
						console.log(err);
					} else {
				console.log("The file was saved!");
			}
			}); 
			//console.log(body) // Print the google web page.
		} else {
			console.log("error requesting webpage! " + response.statusCode + " " + data.UrlList );
		}
})
			
			response.end();
		}
	});
	

	
  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript"
  };

  path.exists(filename, function(exists) {
    if(!exists) {
	
		
		
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
		
	
	
	var stmt = "SELECT page, score FROM result";
	db.each(stmt, function(err, row) {
		console.log(row.PAGE + ": " + row.SCORE);
		
		d = {}
		//d[row.PAGE] = row.SCORE;
		d["label"] = row.PAGE;
		d["value"] = row.SCORE;
		
		jsonResponse[0].values.push(d); 
		
	  	
	}, function(err,rows) {
		 response.writeHead(200, {"Content-Type": "text/plain"});
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