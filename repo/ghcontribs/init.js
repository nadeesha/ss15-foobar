'use strict';

var request = new XMLHttpRequest();

if (!args || args.length !== 1) {
    stdout('usage: ghcontribs &lt;github-user/github-repo&gt;');
    return;
}

request.open('GET', 'https://api.github.com/repos/' + args[0] + '/contributors', true);

request.onreadystatechange = function() {
    if (request.readyState != 4) {
        return false;
    }

    if (request.status != 200) {
        stdout(request.status);
    }

    var contribs = JSON.parse(request.responseText);

    contribs = contribs.map(function(contrib) {
        return contrib.login + ' => ' + contrib.contributions + ' commits';
    });

    var contributors = ['contributors found: ' + contribs.length].concat(contribs);

    stdout(null, contributors);

    return true;
};

request.send();
