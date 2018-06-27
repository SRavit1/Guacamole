#!/usr/bin/env node

//Following two are used in creating the server and GET/POST requests
var express = require('express');
var app = express();

//Following gets the files to be displayed in sidenav
var ServerUtil = require("./ServerUtil.js");
//Making, removing, and copying directories for client
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var copydir = require("copy-dir");
//Used to get path separator (path.sep) when working with pathnames
var path = require("path");
//Reading and writing to files
var fs = require("fs");
//Creates separate process that runs guna
var cp = require("child_process");
//Prettifies code
var pretty = require("pretty");

var verbose = true;
if (verbose) {
	console.log ("VERBOSE ON");
}

function trace(err) {
        var stack = new Error().stack ;
        console.log(stack);
}

function getTimestamp () {
	var login_date = new Date(Date.now());
	var month = login_date.getMonth();
	var date = login_date.getDate();
	var year = login_date.getFullYear();

	var hours = login_date.getHours();
	var minutes = login_date.getMinutes();
	var seconds = login_date.getSeconds();

	var time = hours + ":" + minutes + ":" + seconds + " " + month + "/" + date + "/" + year;
	return time;
}


/*
Logger function is called whenever a GET/POST request is made
req - request from client; req.method indicates whether it is GET/POST request, req.url is the url to which the request is made
res - response to the user (ex: if user asks for lib.cfg, we "write" the file to res)
next - callback function passed in; not used in logger function
*/
var logger = function(req, res, next) {
    /*
    Following if statement handles POST requests
    There are three types of req.url we check for
	1. '/login'
		This request is made automatically when a user logs in. Information about the user is passed in as data, and is recorded in a file.
	2. '/mkdir'
		This request is also automatically made when a user logs in. The id is passed in as data, and if the user is new or files are missing from the user's directory, new files are created, as well as their respective directories. This '/mkdir' request is segregated from '/login' because it performs a different task.
	3. '/save'
		This request is generated when the user a) clicks a different file or b) presses the save button. In case a) the save POST request is made while the new file is displayed.
    */
    if (req.method == 'POST') {
        if (verbose) {
		console.log("POST: ", req.url);
	}
	if (req.url == '/login') {
            req.on('data', function(data) {
                var fields = JSON.parse(data);

		var fullName = fields.firstName + " " + fields.lastName;
		var id = fields.id;
		var emailAddress = fields.emailAddress;
		var profile = fields.publicProfileUrl;
		var time = getTimestamp();

		var info = fullName + ", " + id + ", " + emailAddress + ", " + profile + ", " + time;

                fs.writeFileSync('logins.csv', fs.readFileSync('logins.csv') + "\n" + info);
            });
        } else if (req.url == '/mkdir') {
            var dirs = ServerUtil.getFiles;
            var files = [];

            var pathname = ServerUtil.pathname;

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
			var directory_pathname = "client" + path.sep + id + path.sep + directory;
			if (!fs.exists(directory_pathname)) {
				mkdirp.sync(directory_pathname);
			}
                        for (var j = 0; j < files.length; j++) {
                            var file_content = fs.readFileSync(pathname + path.sep + directory + path.sep + files[j]);
                            var file_path = "client" + path.sep + id + path.sep + directory + path.sep + files[j];
                            if (!fs.existsSync(file_path)) {
                                fs.writeFileSync(file_path, file_content);
				if (verbose) {
					console.log("CREATING: " + file_path);
				}
                            }
                        }
                    } else {
                        var directory_pathname = 'client' + path.sep + id;
                        if (!fs.existsSync(directory_pathname)) {
                            mkdirp.sync(directory_pathname);
                        }
                        for (var j = 0; j < files.length; j++) {
                            var file_content = fs.readFileSync(pathname + path.sep + files[j]);
                            var file_path = directory_pathname + path.sep + files[j];
                            if (!fs.existsSync(file_path)) {
                                fs.writeFileSync(file_path, file_content);
				if (verbose) {
					console.log("CREATING: " + file_path);
				}
                            }
                        }
                    }
                }
            });
        } else if (req.url == '/save') {
            req.on("data", function(data) {
                var data_string = "" + data;
                var filename;
                var content;
                if (data_string.split("&")[0] != null) {
                    //filename = "client" + path.sep + data_string.split("&")[0].replace(/\%2F/g, path.sep);
		    filename = "client" + path.sep + data_string.split("&")[0];
                }
                if (data_string.split("&")[1] != null) {
                    //content = data_string.split("&")[1].replace(/\+/g, " ");
		    content = data_string.split("&")[1];
                }
                if (verbose) {
                    console.log("\t", filename);
		}                
                fs.writeFile(filename, content, function(err) { 
		    if ( err  )
                        trace(err); 
                    return;		
		});
            });
        }
    }
    /*
    Following if statement handles GET requests
    There are three types of req.url we check for
	1. "/" or ""
		Client is simply asking for html for PDA2:8080
	2. "/run/USER-ID-HERE"
		Client is asking for output of run command
	3. anything else
		Simply asking for a file (ex: styles.css)
    */
    else if (req.method == "GET") {
	if (verbose) {
		console.log("GET: ", req.url);
	}
        /*
	GET request made when the page loads
	Buttons are created for sidenav (directory and file buttons)
	Specifics regarding which buttons to display are obtained from ServerUtil
	*/
        if (req.url == "/" || req.url == "") {
	    /*
	    Data from Serverutil comes in format:
	        [
		['.', run.tcl, main.lib, lib.cfg]
		[CELL1, FILE1]
		[CELL2, FILE1, FILE2]
		[CELLN, FILE1]
		]
		'.' represents no directory (subsequent files have no parent directory)
		CELL1, CELL2, CELLN represent directories
		Subsequent elements in each array (FILE1, FILE2) represent files to display of those directories
	    */
            var dirs = ServerUtil.getFiles;
	    //Reading the index file
            var index = "" + fs.readFileSync("index.html");
	    /*
	    Splitting the index file, before place where buttons are inserted
	    We will concatenate html code for buttons to the end of this top half
	    Then, we will add the bottom half of the index.html file with button html code sandwiched in between
	    
	    The code will look like following:
		index.html top half
		html for buttons (dir and files)
		index.html bottom half
	    */
            var content = index.split("<!--INSERT BUTTONS HERE-->")[0];
	    //pathname stores where the files are located
            var pathname = ServerUtil.pathname;

	    /*
	    To parse the directories from ServerUtil, we will create a nested for loop to iterate through this two dimensional array
	    Outer for loop will iterate through each directory [CELL1, FILE1]
	    Inner for loop will iterate through elements of that directory
	    */
            for (var i = 0; i < dirs.length; i++) {
		//This for loop iterates through each array containing information regarding a single directory and its files
		//dir stores a single array with directory and files: [CELL1, FILE1, FILE2]
                var dir = dirs[i];
		//directory stores the first element  of that array: CELL1, representing the directory name
                var directory;
		//files stores the names of all the files in that directory: [FILE1, FILE2]
                var files = [];
		//we store the directory name and all files in that directory in this for loop
                for (var j = 0; j < dir.length; j++) {
		    //first element dir[0] is name of directory
		    //all other elements dir[n] are files of given directory
                    if (j == 0) {
                        directory = dir[j];
                    } else {
                        files.push(dir[j]);
                    }
                }
		//at this point, we have variable directory storing the name of the directory
		//and variable files storing all files in directory

		//directory with value "." indicates that files have no parent directory (such as run.tcl, main.lib, lib.cfg)
                if (directory == ".") {
		    //we will now add 'file' buttons to content without a parent directory
                    for (var j = 0; j < files.length; j++) {
                        content += "<button class='file' name=" + path.sep + files[j] + ">" + files[j] + "</button>";
                    }
                } 
		//if directory doesn't have value ".", it is an actual cell with files in that directory (CELL2 has FILE1 and FILE2)
		else {
		    //we will first add a 'dir' button with a div representing the contents of the directory
		    //the contents of that div include the files within that directory
                    content += "<button class='dir' name=" + directory + ">" + directory + "<i class='caret-down'>&#9660</i></button><div class='file-container'>";
                    for (var j = 0; j < files.length; j++) {
                        content += "<button class='file' name=" + directory + path.sep + files[j] + ">" + files[j] + "</button>";
                    }
                    content += "</div>";
                }
            }
	    //Adding second half of index.html
            var content_end = index.split("<!--INSERT BUTTONS HERE-->")[1];
            content += content_end;

	    //Prettifying the html, and writing it to res
            res.write(pretty(content));
            res.end();
        }
        /*
	GET request made when run button is clicked
        Creates child process to execute command
	URL of this request is passed in form /run/id-of-user
	ID of client is extracted from url and passed in GUNA_RUNDIR through parameters of cp.spawn, along with user's run.tcl
	*/
        else if (req.url.substr(0, 5) == "/run/") {
            var id = req.url.substr(5);
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-control": "no-cache"
            });
            process.env['PARIPATH_EVAL_LICENSE'] = 1
            var GUNA_RUNDIR = 'client' + path.sep + id;
            var GUNA_EXE = '/home/srohit/WORK/guna/src/Paripath/bin/guna';
            var spw = cp.spawn(GUNA_EXE, ['run.tcl'], { cwd: GUNA_RUNDIR });
	    
	    /*
	    Any data (stdout or stderr) is written to response
	    Just as the process closes, 'ENDOFFILE' is concatenated to end of string
	    This signals index.html to stop showing wait cursor and enable buttons
	    */
            spw.stdout.on('data', function(data) {
                res.write(data);
            });
            spw.stderr.on('data', function(data) {
                res.write(data);
            });
            spw.on('close', function(code) {
                res.end('exit ' + code + '\n' + 'ENDOFFILE'+'\n');
            });
        }
	/*
	miscellaneous get request handler - reads any other file in same directory (or returns 404)
	no special instructions (unlike if statements above)
	*/
        else {
            var url = req.url.substr(1);
            fs.readFile(url, function(err, data) {
                if (err) {
		    if (verbose) {
			console.log("FAIL: " + url);
                        trace(err)
		    }
                    res.write("ERROR 404: NOT FOUND");
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/' + url.split('.').pop() });
                    res.write(data);
                }
                res.end();
            });
/*
	    var data = fs.readFileSync(url);
	    res.writeHead(200, { 'Content-Type': 'text/' + url.split('.').pop() });
	    res.write(data);
	    res.end();
*/
        }
    }
}

//uses the logger function above to handle GET and POST requests
app.use(logger);

//app listens on localhost, specified port
var PORT = 8080;
app.listen(PORT, function() {
     console.log('Server running on port ' + PORT);
});
