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

    function loadRepo() {
        function findRepo(doc, emit) {
            if (doc.type === 'repo') {
                emit(doc);
            }
        }

        termish.db.query({
            map: findRepo
        }, {
            include_docs: true
        }, function(err, response) {
            if (err) {
                console.log(err);
                return;
            }

            if (response.rows.length === 1) {
                termish.repo = response.rows[0].doc.url;

                if (termish.repo[termish.repo.length - 1] !== '/') {
                    termish.repo += '/';
                }

                console.log('repo set at: ' + termish.repo);
            } else {
                console.log('invalid settings for repo found');
            }
        });
    }

    loadRepo();

    termish.installScript = function(scriptName, cb) {
        var definitionJson = termish.repo + scriptName + '/definition.json';

        $.get(definitionJson, parseDefinition);

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

    termish.executeScript = function(name, args, cb) {
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
                cb(err);
            } else if (response.rows.length === 0) {
                cb('invalid command: ' + name);
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

                        frame.code(termish.repo + definition.name + '/' + definition.scriptUrl).run();
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
            termish.executeScript(cmd[0], cmd.slice(1), termish.sendOutput);
        }
    };

    termish.sendOutput = function(err, data, type) {
        var className = 'console-output';

        if (err) {
            className += ' error';
        }

        if (type && type === 'html') {
            termish.output.html(data);
            return;
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
                if (err) {
                    cb(err);
                    return;
                }

                cb(null, 'successfully installed: ghcontribs');
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
        },
        'set-repo': function(args, cb) {
            function findRepo(doc, emit) {
                if (doc.type === 'repo') {
                    emit(doc);
                }
            }

            termish.db.query({
                map: findRepo
            }, {
                include_docs: true
            }, function function_name(err, response) {
                if (err) {
                    cb(err);
                    return;
                }

                if (!response || response.rows.length === 0) {
                    termish.db.post({
                        type: 'repo',
                        url: args[0]
                    }, function(err) {
                        if (err) {
                            cb(err);
                            return;
                        }

                        cb(null, 'new repo url set successfully to: ' + args[0]);

                        loadRepo();
                    });
                } else {
                    var doc = response.rows[0].doc;

                    doc.url = args[0];

                    termish.db.put(doc, function(err) {
                        if (err) {
                            cb(err);
                            return;
                        }

                        cb(null, 'new repo url set successfully to: ' + args[0]);

                        loadRepo();
                    });
                }
            });
        },
        help: function (args, cb) {
            cb(null, termish.helpText, 'html');
        }
    };

    caja.whenReady(function() {
        caja.markFunction(termish.sendOutput);
        termish.services = {
            stdout: caja.tame(termish.sendOutput)
        };
    });

    termish.helpText = termish.output.html();

})(window.termish = window.termish || {}, PouchDB, console, jQuery, swal, _, caja);
