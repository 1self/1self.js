var assert = require("assert");

var oneself = require("../src/1self")

describe('OneSelf', function() {
	describe('Initialize', function() {
		it('should set config to values passed', function() {
			var OneSelf = new oneself({
				appId: '12345'
			});
			assert.equal('12345', OneSelf.config.appId);
		});

		it('should change config to values passed', function() {
			var OneSelf = new oneself();
			OneSelf.configure({'appId': '12345'});
			assert.equal('12345', OneSelf.config.appId);
		});
	})
})