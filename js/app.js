(function(termish, PouchDB, console, $) {

    'use strict';

    termish.db = new PouchDB('termish');

    termish.installScript = function(name, gistUrl) {
        $.get(gistUrl, saveToDb);

        function saveToDb(fn) {
            termish.db.post({
                type: 'script',
                name: name,
                fn: fn
            }, function(err) {
                if (!err) {
                    console.log('script saved');
                } else {
                    console.log(err);
                }
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
                var fn = new Function(response.rows[0].key); // ugh!
                fn.bind(null, args);
            }
        });
    };

})(window.termish = window.termish || {}, PouchDB, console, jQuery);
