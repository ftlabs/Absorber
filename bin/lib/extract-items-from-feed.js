const debug = require('debug')('bin:lib:extract-items-from-feed');
const fetch = require('node-fetch');

const extractUUID = require('./extract-uuid');
const parseRSSFeed = require('./parse-rss-feed');
const separateQueryParams = require('./separate-query-parameters');
const checkItemHasRequiredFields = require('./check-item-has-required-values');
const removeUnwantedFields = require('./remove-unwanted-fields');
const problems = require('./problem-items');

function unpack(value){

	if(value.constructor === Array){
		return value[0];
	} else {
		return value;
	}

}

module.exports = function(feedURL){

	return fetch(feedURL)
		.then(res => res.text())
		.then(text => parseRSSFeed(text))
		.then(feed => {
			debug(feed);
			const P = feed.channel[0].item.map(item => {

				let thisItemUUID;

				return extractUUID( item['guid'][0]._ )
					.then(itemUUID => {

						if(itemUUID === undefined){
							return false;
						}

						if(item.pubDate !== undefined && item.pubdate === undefined){
							item.pubdate = item.pubDate;
						}

						thisItemUUID = itemUUID;

						return checkItemHasRequiredFields(item, process.env.REQUIRED_FEED_ITEMS.split(','))
							.then(item => removeUnwantedFields(item, process.env.REQUIRED_FEED_ITEMS.split(',')))
							.then(item => {

								const audioURL = item.enclosure !== undefined ? item.enclosure[0]['$'].url : item.link[0];
								const metadata = separateQueryParams(audioURL);

								return checkItemHasRequiredFields(metadata, process.env.REQUIRED_METADATA_PARAMETERS.split(','))
									.then(metadata => removeUnwantedFields(metadata, process.env.REQUIRED_METADATA_PARAMETERS.split(',')))
									.then(metadata => {

										debug(itemUUID, metadata);

										const tableEntry = {
											title : unpack(item.title),
											link : unpack(item.link),
											description : unpack(item.description),
											pubdate : item.pubDate !== undefined ? unpack(item.pubDate) : unpack(item.pubdate),
											guid : unpack(item.guid)['_'],
											duration : unpack(metadata.duration),
											uuid : unpack(metadata.uuid),
											format : unpack(metadata.format),
											enabled : true
										};

										tableEntry['unix-pubdate'] = Date.parse(tableEntry.pubdate) / 1000 | 0;
										tableEntry['narrator-id'] = metadata['narrator-id'];
										tableEntry['is-human'] = metadata['is-human'];

										if(tableEntry.description === ''){
											console.log(`'description' is blank. Removing from tableData`);
											delete tableEntry.description;
										}

										return {
											item,
											metadata,
											tableEntry,
											audioURL
										};

									})

								;

							})

						;

					})
					.catch(err => {
						console.log(`An error occurred processing an item ${thisItemUUID} in the feed. Passing over... ${err}`);
						problems.add(thisItemUUID, err);
						return false;
					})

				;

			});

			return Promise.all(P)
				.then(items => items.filter(item => item !== false))
			;
		})
	;

}
