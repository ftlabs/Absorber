const debug = require('debug')('bin:lib:check-file-has-data');
const url = require('url');
const http = require('follow-redirects').http;
const https = require('follow-redirects').https;

module.exports = function(fileURL){

	const u = url.parse(fileURL);

	const requestModule = u.protocol === 'https:' ? https : http;

	const options = {
		host : u.host,
		path : u.path,
		port : u.protocol === 'https:' ? 443 : 80,
		method: 'GET'
	};

	debug('Checking data exists for', fileURL);

	return new Promise( (resolve, reject) => {

		const req = requestModule.get(options, function(response){
				response.on('data', function(chunk){
					req.abort();
					if(chunk.length > 0){
						debug('Data exists for:', fileURL, chunk.length, 'bytes receieved');
						resolve();
					} else {
						reject(`File at ${fileURL} returned 0 bytes. ABSORB ABORTED.`);
					}

				});
			})
			.on('error', function(err){
				try {
					req.abort();
				} catch(err){
					console.log(`REQUEST ABORT FAILED ${err}`);
				}
				reject(err);
			})
		;

	} );


};
