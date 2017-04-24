var chai = require('chai');
var assert = chai.assert;
var HttpCollector =  require('../lib/HttpCollector');
var ErrorCollector = require('../lib/ErrorCollector');

describe('ErrorCollector with errors', function() {
	var self = this;
	var errorData = {
	message: '401 Unauthorized',
  	url: '/api/search/filter/list',
  	method: 'POST',
  	stack: '',
  	status: 401
    };
	var expected = { 
		'401 Unauthorized:$::$:/api/search/filter/list:$:POST': 
   		{ 
   			count: 1,
			method: 'POST',
			url: '/api/search/filter/list',
			message: '401 Unauthorized',
			details: ''
		} 
 	};
  	self.httpCollector = new HttpCollector();
  	self.errorCollector = new ErrorCollector();
  	self['errorCollector'].collect(errorData);
  	console.log(self['errorCollector'].collection);
  	it('ErrorCollector response should be equal', function() {
  		var collectObj = self['errorCollector'].collection;
  		delete collectObj['401 Unauthorized:$::$:/api/search/filter/list:$:POST'].timestamp;
    	assert.deepEqual(collectObj, expected);
  	});
});