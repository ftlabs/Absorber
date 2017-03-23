const debug = require('debug')('bin:lib:extract-items-from-rss');
const fetch = require('node-fetch');

const extract = require('./extract-uuid');
const parseRSSFeed = require('./parse-rss-feed');

module.exports = function(feedURL){

	return fetch(feedURL)
		.then(res => res.text())
		.then(text => parseRSSFeed(text))
		.then(feed => {
			debug(feed);

			const P = feed.channel[0].item.map(item => {
				debug(item);
				return extract( item['guid'][0]._ )
					.then(itemUUID => {
						debug(itemUUID);
						if(itemUUID === undefined){
							return false;
						}

						debug('\n\n\n', item, '\n\n\n');
						debug(item.link[0].split('?')[0]);
						
						const audioURL = item.link[0];
						const metadata = {
							uuid : itemUUID,
							originalURL : audioURL.split('?')[0],
							title : item.title[0],
							description : item.description[0],
							published :  item.pubDate !== undefined ? item.pubDate[0] : item.pubdate[0]
						};

						return {
							item,
							metadata,
							audioURL
						};

					})
				;

			});

			return Promise.all(P)

		})
		.catch(err => {
			debug(err);
		})
	;


}