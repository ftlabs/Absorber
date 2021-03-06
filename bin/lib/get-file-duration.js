const debug = require('debug')('bin:lib:get-file-duration');
const fs = require('fs');
const fetch = require('node-fetch');
const shortID = require('shortid').generate;

const tmpPath = process.env.TMP_PATH || '/tmp';
const ffprobe = require('node-ffprobe');
process.env.FFPROBE_PATH = require('ffprobe-static').path;

module.exports = function(audioURL){

	const tmpID = shortID();
	const localDestination = `${tmpPath}/${tmpID}`;

	return fetch(audioURL)
		.then(res => {
			const fsStream = fs.createWriteStream(localDestination);
			debug(`Writing file ${tmpID} to ${localDestination} for probing...`);

			return new Promise((resolve) => {

				fsStream.on('close', function(){
					debug(`${tmpID} has been written to ${localDestination}`);
					resolve(localDestination);
				});

				res.body.pipe(fsStream);

			});

		})
		.then(filePath => {

			return new Promise( (resolve, reject) => {

					ffprobe(filePath, function(err, data){
						if(err){
							reject(err);
						} else {

							fs.unlink(filePath, () => {
								resolve(data.streams[0].duration);
							});

						}
					});

				})
			;

		})
		.catch(err => {
			console.log(`>>>> FFPROBE ERROR <<<<: err= ${err}`);
			throw err;
		})
	;

};
