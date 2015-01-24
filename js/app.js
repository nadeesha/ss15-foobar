var gobalTestString = "TestSandbox Gobal Var";


(function(termish, PouchDB, console) {

    'use strict';

    termish.db = new PouchDB('termish');

    termish.installScript = function(name, version, fn) {
        fn = fn || 'console.log(this);';

        termish.db.post({
            type: 'script',
            name: name,
            version: version,
            fn: fn
        }, function(err) {
            if (!err) {
                // Replication
                // PouchDB.replicate('termish', 'http://localhost:5984/termish', {live: true});
                console.log('script saved');
            } else {
                console.log(err);
            }
        });
    };

    termish.executeScript = function(name, args) {
        args = args || "";
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
                var strFn = response.rows[0].key;
                // var fn = new Function(response.rows[0].key); // ugh!
                // fn.bind(null, args);

                var sandbox   = new JSandbox();
                console.log(strFn + ";"+name+"();");
                sandbox.eval(strFn + ";"+name+"(input);",
                  function(r) { // Callback
                    console.log(r);
                  },
                  args,
                  function  (err) { // Onerror
                    console.log(err);
                });
            }
        });
    };

})(window.termish = window.termish || {}, PouchDB, console);


