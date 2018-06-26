var fs = require('fs');
var path = require('path');

var guna_ws = function(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return done(null, results);
            file = path.join(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    guna_ws(file, function(err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
};

var gunaws_root = 'demo/flow';

guna_ws(gunaws_root, function(err, ws_files) {

    if (err) throw err;

    var ws_buttons = [
        []
    ];
    ws_files.sort();

    var cell_list = ['.'];
    for (var i = 0; i < ws_files.length; i++) {
        ws_file = ws_files[i].replace(gunaws_root + path.sep, "");
        ext = path.extname(ws_file);

        var path_sep_count = ws_file.split(path.sep).length - 1;

        if (path_sep_count == 1) {
            cell_name = path.dirname(ws_file);
            if (cell_list.indexOf(cell_name) == -1) {
                cell_list.push(cell_name);
                if (ws_buttons.length == 0) ws_buttons.push([])
                ws_buttons.push([]);
            }
            cell_index = cell_list.indexOf(cell_name);
            if (ext == ".cfg" || ext == ".cdf") {
                if (ws_buttons[cell_index].length == 0) {
                    ws_buttons[cell_index].push(cell_name);
                }
                ws_buttons[cell_index].push(path.basename(ws_file));
            }
        } else if (path_sep_count == 0) {
            if (ext == ".tcl" || ext == ".cfg" || ext == ".lib") {
                if (ws_buttons[0].length == 0)
                    ws_buttons[0].push('.');
                ws_buttons[0].push(ws_file);
            }
        }
    }
    //console.log(ws_buttons);

    module.exports.getFiles = ws_buttons;
    module.exports.pathname = gunaws_root;
    
});
