'use strict';

var request = new XMLHttpRequest();

if (!args || args.length === 0) {
    stdout('usage: youtube &lt;search text&gt;');
    return;
}

request.open('GET', 'https://gdata.youtube.com/feeds/api/videos?vq=' + args.join(' ') + '&alt=json', true);

request.onreadystatechange = function() {
    if (request.readyState !== 4) {
        return false;
    }

    if (request.status != 200) {
        stdout(request.status);
    }

    var results = JSON.parse(request.responseText);

    var data = '';

    for (var i = 0; i < results.feed.entry.length ; i++) {
       data += '<a target="_blank" href='+results.feed.entry[i].link[0].href+'>'+results.feed.entry[i].title.$t+'</a><br>';
    }

    stdout(null, data);

    return true;
};

request.send();
