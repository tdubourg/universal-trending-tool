var http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs")
	port = process.argv[2] || 8888;
var qs = require('querystring');
var sqlite3 = require('sqlite3');	
var dbPath = "../database.db";
var db = new sqlite3.Database(dbPath);
var externalrequest = require('request');
var exec = require('child_process').exec;

var test_learning = function (file_path, data_to_match, callback) {
	exec("python ../backend/learning_test.py " + file_path + " " + data_to_match, function (err, stdout, stderr) {
		if (err || stdout.replace("\n",'') !== '0') {
			console.log("Test for", file_path, "and data to match=", data_to_match, "failed with error code", stdout)
			callback(false)
		} else {
			callback(true)
		}
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
		
		request.addListener("end", function() {
			console.log(request.url)
			if(request.url == "/RegisterSearch") {
				response.writeHead(200, {"Content-Type": "text/plain"});
				data = qs.parse(data)
				//Form parameters
				response.write("GetSite called!\n" + "DATA_TO_MATCH" + data.data  + "Project: " + data.project + "\nUrl: " + data.url + "\nPattern: " + data.pattern + "\nLimit: " + data.limit);
				
				//Get Webpage
				console.log("Making request to " + data.url );
				externalrequest(data.url, function (error, req_resp, body) {
					if (!error && req_resp.statusCode == 200) {
						var fs = require('fs');

						var fname = path.join(path.join(__dirname, "/tmp/"), data.project)
						var stmt = db.prepare("INSERT INTO search(DATA_TO_MATCH, HTML_LEARNING_DATA, URL, NAME, PATTERN, CRAWL_LIMIT) VALUES(?,?,?,?,?,?)");
						stmt.run(data.data, body, data.url, data.project, data.pattern, data.limit); 
						stmt.finalize();
						fs.writeFile(fname, body, function(err) {
							if(err) {
								console.log(err);
							} else {
								console.log("The file was saved!");
								// Now, test it:
								test_learning(fname, data.data, function (result) {
									if (result === true) {
										console.log("learning succeeded")
										response.write("\nThe learning test succeeded!")
									} else {
										console.log("learning failed")
										response.write("\nThe learning test failed.")
									}
									response.end();
								})
							}
						}); 
						//console.log(body) // Print the google web page.
					} else {
						console.log("error requesting webpage! " + response.statusCode + " " + data.UrlList );
						response.end("{'error': 'cannot crawl url'}")
					}
				})
			}
		})
	} else {
		var contentTypesByExtension = {
				'.html': "text/html",
				'.css':  "text/css",
				'.js':   "text/javascript"
			};
	
		if(request.url == "/GetResult"){
			path.exists(filename, function(exists) {
				if(!exists) {			
					fs.exists(dbPath, function(exists) {
						if(exists) {
							console.log("bin da");
						} else {
							console.log("datei nicht da");
						}
					});
					var jsonResponse = [
						{
							"key": "Cumulative Return",
							"values": []
						}
					]
					var stmt = "SELECT page, score FROM result";
					db.each(stmt, function(err, row) {
						console.log(row.PAGE + ": " + row.SCORE);
						d = {}
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
			});		
		} else {
			console.log("request URL is to: " + request.url);
			path.exists(filename, function(exists) {
				if (exists) {
					if (fs.statSync(filename).isDirectory()){
						filename += '/index.html';
					}
				
					fs.readFile(filename, "binary", function(err, file) {
						if(err) {        
							response.writeHead(500, {"Content-Type": "text/plain"});
							response.write(err + "\n");
							response.end();
							return;
						}
						var headers = {};
						var contentType = contentTypesByExtension[path.extname(filename)];
						if (contentType){ 
							headers["Content-Type"] = contentType;
						}
						response.writeHead(200, headers);
						response.write(file, "binary");
						response.end();
					});
				}
			})
		}
	}
}).listen(parseInt(port, 10));





console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");