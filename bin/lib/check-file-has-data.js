const debug = require('debug')('bin:lib:check-file-has-data');
const fetch = require('node-fetch');

module.exports = function(fileURL){

	return fetch(fileURL)
		.then(res => {

			return new Promise( (resolve, reject) => {

				res.body.on('data', function(chunk){

					if(chunk.length > 0){
						debug('Data exists for:', fileURL, chunk.length, 'bytes receieved');
						res.body.end();
						resolve();
					} else {
						reject(`File at ${fileURL} returned 0 bytes. ABSORB ABORTED.`);
					}

				});

			})

		})
		.catch(err => {
			debug(`Error occurred fetching ${fileURL}`, err);
			throw err;
		})
	;

};