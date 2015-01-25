(function(termish, PouchDB, console, $, alert, _, caja) {

    'use strict';

    termish.db = new PouchDB('termish');
    termish.input = $('#input');
    termish.output = $('#output');

    function validateDefinition(def) {
        if (!def) {
            throw ('no definition supplied');
        }

        if (!def.name) {
            throw ('definition must contain a valid name');
        }

        if (def.endpoints && !_.isArray(def.endpoints)) {
            throw ('endpoints must be defined as an array');
        }

        if (!def.scriptUrl) {
            throw ('a script url must be supplied');
        }

        return def;
    }

    termish.installScript = function(url, cb) {
        $.get(url, parseDefinition);

        function parseDefinition(json) {
            var definition = null;

            try {
                definition = validateDefinition(json);
            } catch (err) {
                cb(err);
                return;
            }

            if (definition.endpoints && definition.endpoints.length > 0) {
                askForPermission(definition.endpoints, function(confirmed) {
                    if (!confirmed) {
                        cb('script installation cancelled');
                    } else {
                        saveToDb(definition);
                    }
                });
            } else {
                saveToDb(definition);
            }
        }

        function askForPermission(endpoints, handleConfirmation) {
            alert({
                title: 'Are you sure?',
                text: 'This script will be able to communicate with the following url(s): ' + endpoints.join(', '),
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes',
                cancelButtonText: 'No, cancel installation!',
                closeOnConfirm: true,
                closeOnCancel: true
            }, handleConfirmation);
        }

        function saveToDb(definition) {
            termish.db.post(_.extend(definition, {
                type: 'script'
            }), function(err) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, 'script installed successfully');
                }
            });
        }
    };

    termish.executeScript = function(name, args) {
        function findLatestScript(doc, emit) {
            if (doc.type === 'script' && doc.name === name) {
                emit(doc);
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
                var definition = response.rows[0].doc;

                var uriPolicy = {
                    rewrite: function(url) {
                        var allowed = _.find(definition.endpoints, function(endpoint) {
                            return url.domain_ === endpoint;
                        });

                        if (allowed) {
                            return url;
                        } else {
                            return undefined;
                        }
                    }
                };

                caja.load(
                    document.getElementById('output'),
                    uriPolicy, // set network access here
                    function(frame) {

                        frame.api({
                            args: caja.tame(args),
                            stdout: termish.services.stdout
                        });

                        frame.code(definition.scriptUrl).run();
                    });
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
        var className = 'console-output';

        if (err) {
            className += ' error';
        }

        var out = err || data;

        if (!_.isArray(out)) {
            out = [out];
        }

        out = _.map(out, function(line) {
            return '<p class="' + className + '">' + line + '</p>';
        });

        termish.output.html(out);
    };

    termish.commands = {
        install: function(args, cb) {
            termish.installScript(args[0], function(err) {
                cb(err || 'script saved');
            });
        },
        list: function(args, cb) {
            function findAllScripts(doc, emit) {
                if (doc.type === 'script') {
                    emit(doc);
                }
            }

            termish.db.query({
                map: findAllScripts
            }, {
                include_docs: true
            }, function function_name(err, response) {
                if (err) {
                    cb(err);
                    return;
                }

                var scripts = _.map(response.rows, function(row) {
                    return row.doc.name;
                });

                cb(null, scripts);
            });
        },
        remove: function(args, cb) {
            function findScript(doc, emit) {
                if (doc.type === 'script' && doc.name === args[0]) {
                    emit(doc);
                }
            }

            termish.db.query({
                map: findScript
            }, {
                include_docs: true
            }, function function_name(err, response) {
                if (err) {
                    cb(err);
                    return;
                }

                if (!response || response.rows.length === 0) {
                    cb(['no such script available']);
                }

                var doc = response.rows[0].doc;

                termish.db.remove(doc, function(err) {
                    cb(err, [doc.name + ' uninstalled successfully']);
                });
            });
        }
    };

    caja.whenReady(function() {
        caja.markFunction(termish.sendOutput);
        termish.services = {
            stdout: caja.tame(termish.sendOutput)
        };
    });

})(window.termish = window.termish || {}, PouchDB, console, jQuery, swal, _, caja);
