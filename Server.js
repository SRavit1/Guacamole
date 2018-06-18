var express = require('express');
var app = express();
var fs = require("fs");
var ServerUtil = require("./ServerUtil.js");
var mkdirp = require("mkdirp");
var pretty = require("pretty");
var rimraf = require("rimraf");
var path = require("path");
var cp = require("child_process");

function makeID() {
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    for (var i = 0; i < 5; i++) {
        id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return id;
}
var id;

var logger = function(req, res, next) {
    if (req.method == 'POST') {
        req.on("data", function(data) {
            var data_string = "" + data;
            var filename = "client/" + data_string.split("&")[0].replace(/\%2F/g, "/");
            var content = data_string.split("&")[1].replace(/\+/g, " ");
            fs.writeFile(filename, content);
        });
    } else if (req.method == "GET") {
        if (req.url == "/") {
            id = makeID();
            var dirs = ServerUtil.getFiles;
            var index = "" + fs.readFileSync("index.html");
            var content = index.split("<!--INSERT BUTTONS HERE-->")[0];
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

            //var content_end = fs.readFileSync("index2.html");
            var content_end = index.split("<!--INSERT BUTTONS HERE-->")[1];
            content += content_end;

            res.write(pretty(content));
            res.end();
        } else if (req.url == "/run") {
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-control": "no-cache"
            });
            var spw = cp.spawn('/home/ravit/app/guna.sh', ['run.tcl']),
                str = "";

            spw.stdout.on('data', function(data) {
                str += data.toString();

                // Flush out line by line.
                var lines = str.split("\n");
                for (var i in lines) {
                    if (i == lines.length - 1) {
                        str = lines[i];
                    } else { // Note: The double-newline is *required*
                        res.write(lines[i] + "\n");
                    }
                }
            });
        } else if (req.url == "/exit") {
            var curr_path = "." + path.sep + id;
            rimraf("client/" + curr_path, function() {
                res.end("<!DOCTYPE html><html><body><h3>Thank you for using Guna Explorer!</h3></body></html>");
            });
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
}

app.use(logger);

app.listen(8093, function() {});