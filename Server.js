var http = require("http");
var fs = require("fs");
var ServerUtil = require("./ServerUtil.js");
var mkdirp = require("mkdirp");
var pretty = require("pretty");
var rimraf = require("rimraf");
var path = require("path");
var spawn = require("child_process").spawn;

function makeID() {
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    for (var i = 0; i < 5; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
}
var id;

var server = http.createServer(function(req, res) {
    if (req.method == 'POST') {
        req.on("data", function(data) {
            var data_string = "" + data;
            var filename = "client/" + data_string.split("&")[0].substr(10).replace(/\%2F/g, "/");
            var content = data_string.split("&")[1].substr(8).replace(/\+/g, " ");
            fs.writeFile(filename, content);
        });
        if (req.url == "/save") {
            res.end("<!DOCTYPE html><html><body><h3>Thank you for saving!</h3></body></html>");
        }
        if (req.url == "/run") {
            var child = spawn('/home/ravit/app/guna.sh', ['run.tcl']);
            //child.stdout.pipe(process.stdout);
            var prev_data = "";
            var content = "";
            child.stdout.on('data', function(data) {
                /*res.pipe(data);
                content += data;*/
                var str = "";
                str += data.toString();

                // just so we can see the server is doing something
                console.log("data");

                // Flush out line by line.
                var lines = str.split("\n");
                for (var i in lines) {
                    if (i == lines.length - 1) {
                        str = lines[i];
                    } else {
                        // Note: The double-newline is *required*
                        res.write(lines[i] + "\n\n");
                    }
                }
            });
            child.on('exit', function(code, signal) {
                console.log(content);
                res.end();
            });
            //res.end("<!DOCTYPE html><html><body><h3>Thank you for running!</h3></body></html>");
        }
        if (req.url == "/exit") {
            var curr_path = "." + path.sep + id;
            rimraf("client/" + curr_path, function() {
                res.end("<!DOCTYPE html><html><body><h3>Thank you for using Guna Explorer!</h3></body></html>");
            });
        }
    } else if (req.method == "GET") {
        if (req.url == "/") {
            id = makeID();
            var dirs = ServerUtil.getFiles;
            var content = fs.readFileSync("index1.html");
            var files;
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
                    content += "<button class='dir' name=" + id + "/" + directory + ">" + directory + "<i class='caret-down'>&#9660</i></button><div class='file-container'>";
                    mkdirp.sync("client/" + id + "/" + directory);
                    for (var j = 0; j < files.length; j++) {
                        content += "<button class='file' name=" + id + "/" + directory + "/" + files[j] + ">" + files[j] + "</button>";
                        var file_content = fs.readFileSync("demo/" + directory + "/" + files[j]);
                        var curr_path = "client/" + id + "/" + directory + "/" + files[j];
                        fs.writeFileSync(curr_path, file_content);
                    }
                    content += "</div>";
                } else {
                    mkdirp.sync("client/" + id);
                    for (var j = 0; j < files.length; j++) {
                        content += "<button class='file' name=/" + id + "/" + files[j] + ">" + files[j] + "</button>";
                        var file_content = fs.readFileSync("demo/" + directory + "/" + files[j]);
                        var curr_path = "client/" + id + "/" + files[j];
                        if (!fs.existsSync("client")) {
                            fs.mkdirSync("client");
                        }
                        fs.writeFileSync(curr_path, file_content);
                    }
                }
            }

            var content_end = fs.readFileSync("index2.html");
            content += content_end;

            res.write(pretty(content));
            res.end();
        } else {
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
});
server.listen(8093);