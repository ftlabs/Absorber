const debug = require('debug')('bin:lib:purge-availability-cache-of-item');
const fetch = require('node-fetch');

module.exports = function(uuid){

	return fetch(`${process.env.FT_AVAILABILITY_SERVICE_URL}/check/${uuid}`, { method : 'PURGE' })
		.then(res => {
			if(res.ok){
				return res.json();
			} else {
				throw res;
			}
		})
		.catch(err => {
			debug(`An error occurred purging the cache for ${uuid} at ${process.env.FT_AVAILABILITY_SERVICE_URL}`, err);
			throw err;
		})
	;

};