
var Proxy = {

	wrap: function(object, methods, wrapper){
		if(!methods || !wrapper || !object){
			console.error('Must provide object, method and wrapper function');
		}
		if (!Array.isArray(methods)) {
			methods = [methods]
		}

		methods.forEach(function(method){
			var original = object[method];
			var wrapped = wrapper(original, method)
			wrapped.__AGENT_ORIGINAL__ = original
			object[method] = wrapped 
		})

	}
}

module.exports = Proxy