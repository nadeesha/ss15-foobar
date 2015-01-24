(function square(args, callback) {
	'use strict';

	this.exec = function () {
		return callback(args[0]);
	};
})();
