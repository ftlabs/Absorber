const debug = require('debug')('bin:lib:extract-items-from-feed');
const fetch = require('node-fetch');

const extractUUID = require('./extract-uuid');
const parseRSSFeed = require('./parse-rss-feed');
const separateQueryParams = require('./separate-query-parameters');
const checkItemHasRequiredFields = require('./check-item-has-required-values');
const checkItemHasRequiredMetadata = require('./check-metadata-has-required-values');
const removeUnwantedFields = require('./remove-unwanted-fields');

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

				return extractUUID( item['guid'][0]._ )
					.then(itemUUID => {

						if(itemUUID === undefined){
							return false;
						}

						return checkItemHasRequiredFields(item)
							.then(item => removeUnwantedFields(item, ['title', 'link', 'description', 'pubdate', 'guid']))
							.then(item => {

								const audioURL = item.enclosure !== undefined ? item.enclosure[0]['$'].url : item.link[0];
								const metadata = separateQueryParams(audioURL);
								
								return checkItemHasRequiredMetadata(metadata)
									.then(metadata => removeUnwantedFields(metadata, ['duration', 'narrator-id', 'uuid', 'is-human', 'format']))
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
											format : unpack(metadata.format)
										};

										tableEntry['narrator-id'] = metadata['narrator-id'];
										tableEntry['is-human'] = metadata['is-human'];

										return {
											item,
											metadata,
											tableEntry,
											audioURL
										};

									})
									.catch(err => {
										debug(err);
									})
								;



							})
							.catch(err => {
								debug(err);
							})
						;

					})
				;
				
			});

			return Promise.all(P)
				.then(function(p){
					debug('All done');
					return p;
				})
			;

		})
		.catch(err => {
			debug(err);
		})
	;



}