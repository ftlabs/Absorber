const debug = require('debug')('bin:lib:parse-rss-feed');
const xml2js = require('xml2js');

module.exports = function(text){

	return new Promise((resolve, reject) => {

		xml2js.parseString(text, (err, result) => {

			if(err){
				reject(err);
			} else {
				if(result !== null){
					resolve(result.rss);
				} else {
					console.log('Parsing of RSS did not complete as expected. TEXT:', text, 'RESULT:', JSON.stringify(result), 'ERR:', JSON.stringify(err) );
					reject();
				}

			}

		});

	});

}
