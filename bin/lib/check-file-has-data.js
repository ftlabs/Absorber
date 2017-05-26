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

				res.body.on('data', function(data){
					console.log(data);
					if(firstChunk){
						if(data.length > 0){
							firstChunk = false;
							res.body.end();
							resolve();
						} else {
							reject(`There was no data at the URL: '${fileURL}'`);
						}
					}


				});

			})
			
		})
	;

};