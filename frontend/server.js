var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;
var qs 		    = require('querystring');	
var exec = require('child_process').exec;

var test_learning = function (file_path, data_to_match, callback) {
	exec("python ../backend/learning_test.py", function (err, stdout, stderr) {
		if (err || stdout !== "0") {
			console.log("Test for", file_path, "and data to match", data_to_match, "failed with error code", stdout)
			callback(false)
		}
		callback(true)
	})
}

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
			response.write("GetSite aufgerufen!\n" + "Project: " + data.project + "\nUrl: " + data.url + "\nPattern: " + data.pattern + "\nLimit: " + data.limit);
			
			//Get Webpage
			var externalrequest = require('request');
				externalrequest(data.UrlList, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var fs = require('fs');
				var fname = __dirname + "/tmp/asddas"
				fs.writeFile(fname, body, function(err) {
					if(err) {
						console.log(err);
					} else {
				console.log("The file was saved!");
				// Now, test it:
				test_learning(fname, "test", function (result) {
					if (result === true) {
						response.write("\nThe learning test failed.")
					} else {
						response.write("\nThe learning test succeeded!")
					}
				})
			}
			}); 
			//console.log(body) // Print the google web page.
		} else {
			console.log("No webpage found! " + response.statusCode + " " + data.UrlList );
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