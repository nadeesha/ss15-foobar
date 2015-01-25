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

xhr('get', 'http://baconipsum.com/api/?type=meat-and-filler', function(response) {
    if (response && response.length > 0) {
        stdout(null, JSON.parse(response));
    }
});
