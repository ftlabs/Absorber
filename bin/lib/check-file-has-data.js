const debug = require('debug')('bin:lib:check-file-has-data');
const url = require('url');
const http = require('http');
const https = require('https');

const fetch = require('node-fetch');

module.exports = function(fileURL){

	return fetch(fileURL)
		.then(res => {

			return new Promise( (resolve, reject) => {

				let firstChunk = true;

				res.body.on('data', function(chunk){

					if(firstChunk){

						if(chunk.length > 0){

							debug('Data exists for:', fileURL, chunk.length, 'bytes receieved');
							firstChunk = false;
							res.body.end();
							resolve();

						} else {

							reject(`File at ${fileURL} returned 0 bytes. ABSORB ABORTED.`);

						}

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