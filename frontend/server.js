"use strict"
var http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs")
var	port = process.argv[2] || 8888;
var qs = require('querystring');
var sqlite3 = require('sqlite3');	
var dbPath = "../database.db";
var db = new sqlite3.Database(dbPath);
db.on("error", function (err) {
	console.error("## SQLITE ERROR##", err)
})
var externalrequest = require('request');
var exec = require('child_process').exec;
var tmp = require('tmp');
var fs = require('fs');

var test_learning = function (file_path, data_to_match, callback) {
	exec("python ../backend/learning_test.py " + file_path + " '" + data_to_match.replace("'", "\'") + "'", function (err, stdout, stderr) {
		if (err || stdout.replace("\n",'') !== '0') {
			console.log("Test for", file_path, "and data to match=", data_to_match, "failed with error code", stdout)
			callback(false)
		} else {
			callback(true)
		}
	})
}

http.createServer(function(request, response) {
	var server_base = 'http://127.0.0.1:' + port
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
			console.log("REQURL=",request.url)
			
			
			if(request.url == "/StartProcess") {
				response.writeHead(200, {"Content-Type": "text/plain"});
				data = qs.parse(data)
				
				//Get Webpage
				console.log("Making request to " + data.url );
				externalrequest(data.url, function (error, req_resp, body) {
					if (!error && req_resp.statusCode == 200) {
						console.log("learning test on:", data.tmp_path)
						test_learning(data.tmp_path.replace("/tmp", "../frontend/tmp"), data.data_to_match, function (result) {
							if (result === true) {
								console.log("learning succeeded")
								response.end("{}")
								var stmt = db.prepare(
									"INSERT INTO search(DATA_TO_MATCH, HTML_LEARNING_DATA, URL, NAME, PATTERN, CRAWL_LIMIT, DATA_CLEANING, CLEANING_GUID)"
									+" VALUES(?,?,?,?,?,?,?, ?)");
								stmt.on("error", function (err) {
									console.error("INSERTION ERROR:", err)
								})
								stmt.run(
									data.data_to_match, body,
									data.url,
									data.project,
									data.pattern,
									data.limit,
									data.data_to_match_replaced,
									data.guid
									); 
								stmt.finalize();
							} else {
								console.log("learning failed")
								var jsonErrorResp = [
									{
										"error": "We did not find the data in the page",
										"validity": "invalid",
										"values": "learning failed"
									}
								]
								response.write(JSON.stringify(jsonErrorResp));
								response.end();
							}
							response.end();
						})
					} else {
						console.log("error requesting webpage! " + response.statusCode + " " + data.UrlList );
						var jsonErrorResp = [
							{
								"validity": "invalid",
								"values": "error requesting webpage"
							}
						]
						response.end(JSON.stringify(jsonErrorResp));
					}
				})
			} else if(request.url == "/DownloadPage") {
				console.log("Requested DownloadPage")
				response.writeHead(200, {
					"Content-Type": "text/plain",
					'Access-Control-Request-Headers': 'X-Requested-With, accept, content-type',
					'Access-Control-Allow-Methods': 'GET, POST'
				});
				data = qs.parse(data);
				console.log("Starting the ext req")
				externalrequest(data.url, function (error, req_resp, body) {
					console.log("Ext req is done")
					if (!error && req_resp.statusCode == 200) {
						console.log("And everything is fine")
						tmp.tmpName(function (err, path, fd) {
							if (err) {
								response.end("{'error': 'temporary file creation error'")
							} else {
								var path2 = path.replace('/tmp/', './tmp/')
								fs.writeFile(path2, body, function(err) {
									if(err) {
										console.log(err);
									} else {
										console.log("The file was saved!");
										response.end(JSON.stringify(
											{
												'temporary_url': server_base + path,
												'tmp_path': path,
												'validity': 'valid'
											}
										));
									}
								}); 
							}
						});
						return;
					} else {
						console.log("But error happened")
						var jsonErrorResp = 
							{
								"validity": "invalid",
								"values": data.url
							}
						console.log("jasonfile: " + JSON.stringify(jsonErrorResp));
						response.write(JSON.stringify(jsonErrorResp));
						console.log("jasonfile: " + JSON.stringify(jsonErrorResp));
						response.end();
						return;
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
					console.log("request URL is to: " + request.url);
					fs.exists(dbPath, function(exists) {
						if(exists) {
							console.log("bin da");
						} else {
							console.log("datei nicht da");
						}
					});
					var jsonResponse = 
						{
							"key": "Trending score over selected time range",
							"values": []
						}
					
					var stmtMaxScores = "select max(timestamp) as maxtimestamp, score, page from result group by page";
					var stmtMinScores = "select min(timestamp) as mintimestamp, score, page from result group by page";
					
					var urls_to_trending_score = {}
					var max_timestamps = {}
					var i =0;
					db.each(stmtMaxScores, function(err, row) {
						// console.log("there", row)
						// console.log("here", row)
						urls_to_trending_score[row.PAGE] = row.SCORE;
						max_timestamps[row.PAGE] = row.maxtimestamp;
					}, function () {
						// console.log(urls_to_trending_score)
						// console.log(max_timestamps)
						db.each(stmtMinScores, function(err, row2) {
							// console.log(row2)
							// Substract the score at the min timestamp
							// and divide by the timestamp delta
							var denominator = parseInt(max_timestamps[row2.PAGE]) - parseInt(row2.mintimestamp)
							if (denominator == 0) {
								var result = (parseInt(urls_to_trending_score[row2.PAGE]) - parseInt(row2.SCORE))
							} else  {
								var result = (parseInt(urls_to_trending_score[row2.PAGE]) - parseInt(row2.SCORE)) / denominator;
							}
							if (result) {
								jsonResponse['values'].push({
									'label': row2.PAGE, 
									'value': result * 10000
								})
							};
						}, function(err,rows) {
							response.writeHead(200, {"Content-Type": "text/plain"});
							var items = jsonResponse.values
							items.sort(function (a, b) {
							    if (a.value < b.value)
							      return 1;
							    if (a.value > b.value)
							      return -1;
							    // a must be equal to b
							    return 0;
							});
							response.write(JSON.stringify([jsonResponse]));
							response.end();
						});
					})
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
				} else {
					response.writeHead(404)
					response.end()
				}
			})
		}
	}
}).listen(parseInt(port, 10));





console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");