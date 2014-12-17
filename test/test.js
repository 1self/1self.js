var assert = require("assert");

var Lib1self = require("../src/1self")

describe('1Self', function() {
	describe('Initialize', function() {
		it('should set config to values passed', function() {
			var lib1self = new Lib1self({
				appId: '12345'
			});
			assert.equal('12345', lib1self.config.appId);
		});
	});
})