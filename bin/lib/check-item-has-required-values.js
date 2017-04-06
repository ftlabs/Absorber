const debug = require('debug')('bin:lib:check-item-has-required-values');

module.exports = function(item, requiredItems){

	return new Promise( (resolve, reject) => {

		const missingRequiredItemValues = [];

		requiredItems.forEach(key => {
			
			if(item[key] === undefined){
				missingRequiredItemValues.push(key);
			}

		});
		
		if(missingRequiredItemValues.length > 0){
			reject(`Item is missing the required values '${missingRequiredItemValues.join(', ')}'.`, item);
		} else {
			debug(`ITEM HAS REQUIRED FIELDS`);
			resolve(item);
		}

	});

}