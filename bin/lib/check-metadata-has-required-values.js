const debug = require('debug')('bin:lib:check-metadata-has-required-values');
const requiredMetadataValues = ['duration', 'narrator-id', 'uuid', 'is-human', 'format'];

module.exports = function(metadata){

	return new Promise( (resolve, reject) => {

		const missingRequiredMetadataValues = [];

		requiredMetadataValues.forEach(key => {

			debug(metadata[key], key)

			if(metadata[key] === undefined){
				missingRequiredMetadataValues.push(key);
			}

		
		});
		
		if(missingRequiredMetadataValues.length > 0){
			reject(`Metadata is missing the required values '${missingRequiredMetadataValues.join(', ')}'.`);
		} else {
			debug(`METADATA HAS REQUIRED FIELDS`);
			resolve(metadata);
		}

	});

}