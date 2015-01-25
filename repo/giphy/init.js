var xhr = function() {
    var xhr = new XMLHttpRequest();
    return function(method, url, callback) {
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                callback(xhr.responseText);
            }
        };
        xhr.open(method, url);
        xhr.send();
    };
}();

if (!args || args.length !== 1) {
    stdout('usage: giphy &lt;keyword&gt;');
    return;
}

xhr('get', 'https://api.giphy.com/v1/stickers/random?api_key=dc6zaTOxFJmzC&tag=' + args[0], function(response) {
    response = JSON.parse(response);
    stdout(null, '<img src="' + response.data.fixed_height_downsampled_url + '">', 'html');
});
