const debug = require('debug')('bin:lib:separate-query-parameters');

module.exports = function(queryString = ''){

	const data = {};
	
	if(queryString === undefined || queryString.indexOf('?') < 0){
		throw 'No query string to separate parameters from';
	}

	queryString = queryString.split('?')[1].split('&').forEach(parameter => {
		const keyAndValue = parameter.split('=');

		if(keyAndValue[1] !== ""){
			data[keyAndValue[0]] = decodeURIComponent(keyAndValue[1]);
		}

	});

	return data;

};