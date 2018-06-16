var http = require("http");
var fs = require("fs");
var ServerUtil = require("./ServerUtil.js");
var mkdirp = require("mkdirp");
var pretty = require("pretty");
var rimraf = require("rimraf");

var server = http.createServer(function(req, res) {
    var id = "";
    if (req.method == 'POST') {
        req.on("data", function(data) {
            if (req.url == "/save") {
                var data_string = "" + data;
                var filename = data_string.split("&")[0].substr(10).replace(/\%2F/g, "/");
                var content = data_string.split("&")[1].substr(8).replace(/\+/g, " ");
                console.log(filename);
                console.log(content);
                fs.writeFileSync(filename, content);
            }
            if (req.url == "/run") {
                var data_string = "" + data;
                var filename = data_string.split("&")[0].substr(10).replace(/\%2F/g, "/");
                var content = data_string.split("&")[1].substr(8).replace(/\+/g, " ");
                fs.writeFileSync(filename, content);
                console.log("" + data);
            }
            if (req.url == "/exit") {
                console.log(id);
                rimraf.sync("/" + id);
            }
        });
    } else if (req.method == "GET") {
        if (req.url == "/") {
            //Make ID
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
            for (var i = 0; i < 5; i++)
                id += possible.charAt(Math.floor(Math.random() * possible.length));

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
                    mkdirp.sync(id + "/" + directory);
                    for (var j = 0; j < files.length; j++) {
                        content += "<button class='file' name=" + id + "/" + +files[j] + ">" + files[j] + "</button>";
                        var file_content = fs.readFileSync("demo/" + directory + "/" + files[j]);
                        var path = id + "/" + directory + "/" + files[j];
                        fs.writeFileSync(path, file_content);
                    }
                    content += "</div>";
                } else {
                    mkdirp.sync(id);
                    for (var j = 0; j < files.length; j++) {
                        content += "<button class='file' name=/" + id + "/" + files[j] + ">" + files[j] + "</button>";
                        var file_content = fs.readFileSync("demo/" + directory + "/" + files[j]);
                        var path = id + "/" + files[j];
                        fs.writeFileSync(path, file_content);
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
                    res.write("NOT FOUND: ERROR 404");
                } else {
                    console.log("Success: " + url);
                    //res.writeHead(200, { 'Content-Type': 'text/' + url.split('.').pop() });
                    res.write(data);
                }
                res.end();
            });
        }
    }
});

server.listen(8093);