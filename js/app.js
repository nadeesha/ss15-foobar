(function(termish, PouchDB, console, $) {

    'use strict';

    termish.db = new PouchDB('termish');
    termish.input = $('#input');
    termish.output = $('#output');

    termish.installScript = function(name, gistUrl, cb) {
        $.get(gistUrl, saveToDb);

        function saveToDb(fn) {
            termish.db.post({
                type: 'script',
                name: name,
                fn: fn
            }, function(err) {
                cb(err);
            });
        }
    };

    termish.executeScript = function(name, args) {
        function findLatestScript(doc, emit) {
            if (doc.type === 'script' && doc.name === name) {
                emit(doc.fn);
            }
        }

        termish.db.query({
            map: findLatestScript
        }, {
            include_docs: true
        }, function(err, response) {
            if (err) {
                console.log(err);
            } else if (response.rows.length === 0) {
                console.log('no scripts found by that name');
            } else {
                var Fn = eval('(' + response.rows[0].key + ')'); // ugh!
                var fn = new Fn(args);
                fn.exec(termish.sendOutput);
            }
        });
    };

    termish.input.on('keydown', function(event) {
        if (event.which == 13) {
            termish.runCmd($('#input').val());
        }
    });

    termish.runCmd = function(cmd) {
        cmd = cmd.split(' ');

        if (cmd[0] === 'termish') {
            termish.commands[cmd[1]](cmd.slice(2), termish.sendOutput);
        } else {
            termish.executeScript(cmd[0], cmd.slice(1));
        }
    };

    termish.sendOutput = function(err, data) {
        termish.output.html(err || data);
    };

    termish.commands = {
        install: function(args, cb) {
            termish.installScript(args[0], args[1], function(err) {
                cb(err || 'script saved');
            });
        }
    };

})(window.termish = window.termish || {}, PouchDB, console, jQuery);
