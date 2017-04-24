module.exports = function(type){
	switch(type) {
		case 'http' : 
			return ['method', 'url', 'path'];
	}
}