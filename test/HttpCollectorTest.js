var chai = require('chai');
var assert = chai.assert;
var HttpCollector =  require('../lib/HttpCollector');
var hdr = require('hdr-histogram')(1000, 2000, 5);

describe('HttpCollector without errors', function() {
	var self = this;
	var txn = { 
	id: 'a599086a-4416-42cd-90b8-c7c49fbf1430',
	timer:
	{
		startTime: [ 503327, 973159469 ],
		 duration: 3.39917,
		 endTime: [ 0, 3399170 ] },
		isExternal: false,
		externals: {},
		isOrphan: false,
		isStopped: true,
		isProcessed: true,
		type: 'http',
		url: '/api/search/filter/list',
		method: 'POST',
		statusCode: 200 
	};
	var expected = {
		"/api/search/filter/list:$:POST":
		{
			"count":1,
			"errors":{},
			"error_count":0,
			"time":3399170,
			"externals":{},
			"url":"/api/search/filter/list",
			"method":"POST","status":200,
			"duration":3399170
		}
	}
  	self.httpCollector = new HttpCollector();
  	self['httpCollector'].collect(txn);
  	// hdr.recordValue(expected['/api/search/filter/list:$:POST'].duration*1000000);
  	// console.log('hdr dummy data',hdr.getTotalCount().toString());
  	it('hdr histogram length to be equal', function() {
		var actObj = self['httpCollector'].collection;
		assert.deepEqual(actObj['/api/search/filter/list:$:POST'].hdr.getTotalCount().toString(), '1');
		assert.deepEqual(actObj['/api/search/filter/list:$:POST'].hdr.encode().byteLength,2359336);
  	});
  	it('hdr histogram encoded buffer length to be equal', function() {
		var actObj = self['httpCollector'].collection;
		assert.deepEqual(actObj['/api/search/filter/list:$:POST'].hdr.encode().byteLength,2359336);
  	});
  	it('collection should be equal', function() {
  		var collectObj = self['httpCollector'].collection;
  		delete collectObj['/api/search/filter/list:$:POST'].hdr;
  		delete collectObj['/api/search/filter/list:$:POST'].timestamp;
    	assert.deepEqual(collectObj, expected);
  	});
});

describe('HttpCollector with errors', function() {
	var self = this;
	var txn = { 
	id: 'a599086a-4416-42cd-90b8-c7c49fbf1430',
	timer:
	{
		startTime: [ 503327, 973159469 ],
		 duration: 3.39917,
		 endTime: [ 0, 3399170 ] },
		isExternal: false,
		externals: {},
		isOrphan: false,
		isStopped: true,
		isProcessed: true,
		type: 'http',
		url: '/api/search/filter/list',
		method: 'POST',
		statusCode: 200 
	};
	var err = {
	message: '401 Unauthorized',
  	url: '/api/search/filter/list',
  	method: 'POST',
  	stack: '',
  	status: 401
    };
	var expected = {
		"/api/search/filter/list:$:POST":
		{
			"count":1,
			"errors":{ '401': 
   			[
   			 { message: '401 Unauthorized',
		       url: '/api/search/filter/list',
		       method: 'POST',
		       stack: '',
		       status: 401 } ] 
		   	},
			"error_count":1,
			"time":3399170,
			"externals":{},
			"url":"/api/search/filter/list",
			"method":"POST","status":200,
			"duration":3399170
		}
	}
  	self.httpCollector = new HttpCollector();
  	self['httpCollector'].collect(txn);
  	self['httpCollector'].collectError(err);
  	it('hdr histogram length to be equal', function() {
		var actObj = self['httpCollector'].collection;
		assert.deepEqual(actObj['/api/search/filter/list:$:POST'].hdr.getTotalCount().toString(), '1');
		assert.deepEqual(actObj['/api/search/filter/list:$:POST'].hdr.encode().byteLength,2359336);
  	});
  	it('hdr histogram encoded buffer length to be equal', function() {
		var actObj = self['httpCollector'].collection;
		assert.deepEqual(actObj['/api/search/filter/list:$:POST'].hdr.encode().byteLength,2359336);
  	});
  	it('collection should be equal', function() {
  		var collectObj = self['httpCollector'].collection;
  		delete collectObj['/api/search/filter/list:$:POST'].hdr;
  		delete collectObj['/api/search/filter/list:$:POST'].timestamp;
    	assert.deepEqual(collectObj, expected);
  	});
});

describe('HttpCollector with externals and errors', function() {
	var self = this;
	var txn = { 
	id: 'a599086a-4416-42cd-90b8-c7c49fbf1430',
	timer:
	{
		startTime: [ 503327, 973159469 ],
		 duration: 3.39917,
		 endTime: [ 0, 3399170 ] },
		isExternal: false,
		externals: { 
			'127.0.0.1:$:post:$:500': 
			   { url: '127.0.0.1',
			     method: 'post',
			     count: 1,
			     time: 10.875555,
			     status: 500 } 
			 },
		isOrphan: false,
		isStopped: true,
		isProcessed: true,
		type: 'http',
		url: '/api/search/filter/list',
		method: 'POST',
		statusCode: 200 
	};
	var err = {
	message: '401 Unauthorized',
  	url: '/api/search/filter/list',
  	method: 'POST',
  	stack: '',
  	status: 401
    };
	var expected = {
		"/api/search/filter/list:$:POST":
		{
			"count":1,
			"errors":{ '401': 
   			[
   			 { message: '401 Unauthorized',
		       url: '/api/search/filter/list',
		       method: 'POST',
		       stack: '',
		       status: 401 } ] 
		   	},
			"error_count":1,
			"time":3399170,
			"externals":{'127.0.0.1:$:post:$:500':{ url: '127.0.0.1',
			    method: 'post',
			    count: 1,
			    time: 10.875555,
			    status: 500 } },
			"url":"/api/search/filter/list",
			"method":"POST","status":200,
			"duration":3399170
		}
	};

  	self.httpCollector = new HttpCollector();
  	self['httpCollector'].collect(txn);
  	self['httpCollector'].collectError(err);
  	it('hdr histogram length to be equal', function() {
		var actObj = self['httpCollector'].collection;
		assert.deepEqual(actObj['/api/search/filter/list:$:POST'].hdr.getTotalCount().toString(), '1');
		assert.deepEqual(actObj['/api/search/filter/list:$:POST'].hdr.encode().byteLength,2359336);
  	});
  	it('hdr histogram encoded buffer length to be equal', function() {
		var actObj = self['httpCollector'].collection;
		assert.deepEqual(actObj['/api/search/filter/list:$:POST'].hdr.encode().byteLength,2359336);
  	});
  	it('collection should be equal', function() {
  		var collectObj = self['httpCollector'].collection;
  		delete collectObj['/api/search/filter/list:$:POST'].hdr;
  		delete collectObj['/api/search/filter/list:$:POST'].timestamp;
    	assert.deepEqual(collectObj, expected);
  	});
});