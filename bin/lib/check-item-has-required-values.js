const debug = require('debug')('bin:lib:check-item-has-required-values');
const requiredItemValues = ['title', 'link', 'description', 'pubdate', 'guid'];

module.exports = function(item){

	return new Promise( (resolve, reject) => {

		const missingRequiredItemValues = [];

		requiredItemValues.forEach(key => {
			
			if(item[key] === undefined){
				missingRequiredItemValues.push(key);
			}

		});
		
		if(missingRequiredItemValues.length > 0){
			reject(`Item is missing the required values '${missingRequiredItemValues.join(', ')}'.`);
		} else {
			debug(`ITEM HAS REQUIRED FIELDS`);
			resolve(item);
		}

	});

}