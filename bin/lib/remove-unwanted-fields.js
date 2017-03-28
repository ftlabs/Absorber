const debug = require('debug')('bin:lib:remove-unwanted-fields');

module.exports = function(item, wantedFields){

	return new Promise( (resolve) => {

		const newItem = {};

		wantedFields.forEach(field => {

			newItem[field] = item[field];

		});

		resolve(newItem);

	} );

};