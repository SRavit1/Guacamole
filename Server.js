#!/usr/bin/env node

//Reading and writing to files
var fs = require("fs");
//Following two are used in creating the server and GET/POST requests
var express = require('express');
var app = express();

//Following gets the files that are currently in the directory
var ServerUtil = require("./ServerUtil.js");
//Making and removing directories
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
//Used to get path separator (path.sep)
var path = require("path");
//Creates separate process for run button
var cp = require("child_process");
//Prettifies code
var pretty = require("pretty");
var copydir = require("copy-dir");

//Function to make ID for individual clients
function makeID() {
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    for (var i = 0; i < 5; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
}

//Variable to store each client's identification


//Logger function for GET/POST requests that server uses
var logger = function(req, res, next) {
    //Only POST request made is save, where content is written to filename
    if (req.method == 'POST') {
        console.log("DBG: POST URL : ", req.url);
	if (req.url == '/new') {
            var dirs = ServerUtil.getFiles;
            var files;
            var pathname = ServerUtil.pathname;
            if (!fs.existsSync("client")) {
                fs.mkdirSync("client");
            }

	    req.on("data", function(id) {
		    
		    copydir.sync("demo/data", "client/" + id + "/data");
		    for (var i = 0; i < dirs.length; i++) {
		        var dir = dirs[i];
		        var directory;
		        files = [];
		        for (var j = 0; j < dir.length; j++) {
		            if (j == 0) {
		                directory = dir[j];
		            } else {
		                files.push(dir[j]);
		            }
		        }
		        if (directory != ".") {
		            mkdirp.sync("client" + path.sep + id + path.sep + directory);
		            for (var j = 0; j < files.length; j++) {
		                var file_content = fs.readFileSync(pathname + path.sep +  directory + path.sep + files[j]);
		                var curr_path = "client" + path.sep + id + path.sep + directory + path.sep + files[j];
		                if (!fs.existsSync(curr_path)) {
					fs.writeFileSync(curr_path, file_content);
				}
		            }
		        } else {
			    var base_path = 'client' + path.sep + id;
		            if (!fs.existsSync(curr_path)) {
				mkdirp.sync(base_path);
			    }
		            for (var j = 0; j < files.length; j++) {
		                var file_content = fs.readFileSync(pathname  +  path.sep  + files[j]);
		                var curr_path = base_path + path.sep + files[j];
				if (!fs.existsSync(curr_path)) {
					fs.writeFileSync(curr_path, file_content);
				}
		            }
		        }
            	}
	});
	}
	if (req.url == '/save') {
	    req.on("data", function(data) {
		var data_string = "" + data;
		var filename;
		var content;
		if (data_string.split("&")[0] != null) {
		    filename = "client" + path.sep + data_string.split("&")[0].replace(/\%2F/g, path.sep);
		}
		if (data_string.split("&")[1] != null) {
		    content = data_string.split("&")[1].replace(/\+/g, " ");
		}
		console.log ("Save to: " + filename);
		fs.writeFileSync(filename, content);
            });
	} else if (req.url == '/login') {
	    req.on('data', function(data) {
                var data_string = "" + data
                fs.writeFileSync('example.txt', fs.readFileSync('example.txt') + "\n" + data_string);
            });
	}
    }
    //GET requests involve the index.html, run, exit, and all other files
    else if (req.method == "GET") {
	console.log("DBG: GET URL : ", req.url);
        //GET request made when the page loads (makes new id, creates new directory for client)
        if (req.url == "/" || req.url == "") {
            var dirs = ServerUtil.getFiles;
            var index = "" + fs.readFileSync("index.html");
            var content = index.split("<!--INSERT BUTTONS HERE-->")[0];
            var files;
            var pathname = ServerUtil.pathname;

            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var directory;
                files = [];
                for (var j = 0; j < dir.length; j++) {
                    if (j == 0) {
                        directory = dir[j];
                    } else {
                        files.push(dir[j]);
                    }
                }
                if (directory != ".") {
                    content += "<button class='dir' name=" + directory + ">" + directory + "<i class='caret-down'>&#9660</i></button><div class='file-container'>";
                    for (var j = 0; j < files.length; j++) {
                        content += "<button class='file' name=" + directory + path.sep + files[j] + ">" + files[j] + "</button>";
                    }
                    content += "</div>";
                } else {
                    for (var j = 0; j < files.length; j++) {
                        content += "<button class='file' name=" + path.sep + files[j] + ">" + files[j] + "</button>";
                    }
                }
            }
            var content_end = index.split("<!--INSERT BUTTONS HERE-->")[1];
            content += content_end;

            res.write(pretty(content));
            res.end();
        }


        //GET request made when run button is clicked
        //Creates child process to execute command
        else if (req.url.substr(0,5) == "/run/") {
            var id = req.url.substr(5);
console.log('DBG: req=', req.url);
console.log('DBG: id=', id);
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-control": "no-cache"
            });
            process.env['PARIPATH_EVAL_LICENSE'] = 1
            var GUNA_RUNDIR = 'client' + path.sep + id ;
            //var GUNA_EXE = '/home/paripath/paripath/guna18.1/bin/guna';
            var GUNA_EXE = '/home/srohit/WORK/guna/src/Paripath/bin/guna';
            var spw = cp.spawn(GUNA_EXE, ['run.tcl'], {cwd: GUNA_RUNDIR});
            var str = "";

            spw.stdout.on('data', function (data) {
                res.write(data);
            });
            spw.stderr.on('data', function (data) {
                res.write(data);
            });
            spw.on('close', function (code) {
                res.end('exit '+code+'\n'+'ENDOFFILE');
            });
        }
        //reads any other file in same directory (or returns 404)
        else {
            var url = req.url.substr(1);
            fs.readFile(url, function(err, data) {
                if (err) {
                    console.log("Fail: " + url);
                    res.write("ERROR 404: NOT FOUND");
                } else {
                    //res.writeHead(200, { 'Content-Type': 'text/' + url.split('.').pop() });
                    res.write(data);
                }
                res.end();
            });
        }
    }
}

//uses the function we just made to handle GET and POST requests
app.use(logger);

//app listens on localhost, port 8093
PORT = 8080;
app.listen(PORT, function() {});
console.log('Server running on port ' + PORT);
