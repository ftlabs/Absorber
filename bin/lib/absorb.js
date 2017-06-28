const fs = require('fs');
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const debug = require('debug')('absorb');

const audit = require('./audit');
const database = require('./database');
const mail = require('./mailer');
const generateS3PublicURL = require('./get-s3-public-url');
const extractItemsFromFeed = require('./extract-items-from-feed');
const convert = require('./convert');
const purgeAvailabilityCache = require('./purge-availability-cache-of-item');
const checkFileHasData = require('./check-file-has-data');
const getDurationOfFile = require('./get-file-duration');
const problems = require('./problem-items');

const S3 = new AWS.S3();

const managementURL = process.env.ADMIN_URL || 'no Admin URL specified';
const tmpPath = process.env.TMP_PATH || '/tmp';
const durationAllowance = 5; // Number of  seconds the reported duration of a file is allowed to be innaccurate by.

let poll = undefined;
let problemReportSent = false;

function shouldOverwrite(database, metadata){

	if(database === undefined || metadata === undefined){
		debug(`'database' is ${database}. 'metadata' is ${metadata}`);
		return false;
	}

	if(Object.keys(database).length < 3){
		return true;
	}

	if(database === undefined || database['is-human'] === undefined || metadata === undefined || metadata['is-human'] === undefined){
		return false;
	}

	if(database['is-human'] === 'false'){

		if(metadata['is-human'] === 'true'){
			return true;
		}

		return false;

	}

}

function getDataFromURL(feedInfo){
	
	debug('Known problems:', problems.list());
	debug(feedInfo);

	extractItemsFromFeed(feedInfo.url)
		.then(itemInformation => {
			itemInformation.forEach(datum => {
				debug(datum);
				const item = datum.item;
				const metadata = datum.metadata;
				const audioURL = datum.audioURL;
				const itemUUID = metadata.uuid;

				const tableData = datum.tableEntry;

				tableData.provider = feedInfo.provider;
				tableData['provider_name'] = feedInfo['provider_name'];
				tableData['absorb_time'] = new Date() / 1000 | 0;

				checkFileHasData(audioURL)
					.then(function(){

						database.read({ uuid : itemUUID }, process.env.AWS_METADATA_TABLE)
							.then(databaseItem => {
								
								databaseItem = databaseItem.Item;

								if(databaseItem === undefined || shouldOverwrite(databaseItem, metadata)){
									
									debug(`Item ${itemUUID} has no metadata in database. Adding...`, tableData);

									if(databaseItem !== undefined){
										tableData.enabled = databaseItem.enabled;
									}

									if(process.env.NODE_ENV !== 'development'){

										purgeAvailabilityCache(itemUUID)
											.catch(err => {
												debug(err);
											})
										;

									}

									database.write(tableData, process.env.AWS_METADATA_TABLE)
										.then(function(){
											debug(`Item ${itemUUID} in DynamoDB`, tableData);
										})
										.catch(err => {
											debug("An error occurred when writing audio meta data to the metadata table.", err, tableData);
										})
									;

								} else {
									debug(`Database already has metadata for item ${itemUUID}`);
								}
							
								S3.headObject({
									Bucket : process.env.AWS_AUDIO_BUCKET,
									Key : `${itemUUID}.mp3`
								}, function (err) { 
									
									if ( (err && err.code === 'NotFound') || shouldOverwrite(databaseItem, metadata) ){
										// We don't have that audio file (or we want to overwrite it), so let's grab it.
										debug(`Writing .mp3 version of ${itemUUID} to S3 from ${item.link}.`)
										
										debug(item);

										getDurationOfFile(audioURL)
											.then(duration => {
												if(duration - tableData.duration < -durationAllowance || duration - tableData.duration > durationAllowance){
													debug(`Reported duration of file ${audioURL} is incorrect. Updating database Entry`);
													tableData.duration = duration;
													database.write(tableData, process.env.AWS_METADATA_TABLE)
														.catch(err => {
															debug(`Failed to overwrite duration of ${itemUUID}`, err);
														})
													;

												}
											})
										;

										fetch(audioURL)
											.then(function(res) {
												return res.buffer();
											}).then(function(buffer) {
												debug(buffer);
												S3.putObject({
													Bucket : process.env.AWS_AUDIO_BUCKET,
													Key : `${itemUUID}.${process.env.DELIVERED_MEDIA_FORMAT || 'mp3'}`,
													Body : buffer,
													ACL : 'public-read'
												}, function(err){
													if(err){
														debug(err);
													}

													if(process.env.NODE_ENV === 'production' && metadata['is-human'] === 'true' ){
														debug('Production environment detected. Alerting FT to newly absorbed content.');
														mail.send({
															itemUUID: itemUUID,
															title: item['title'] || 'no title specified',
															ftCopyUrl: generateS3PublicURL(itemUUID),
															partnerCopyUrl: audioURL,
															managementURL: managementURL,
															provider : feedInfo.provider
														});
													} else {
														debug(`Did not send email for piece. ENVIRONMENT: ${process.env.NODE_ENV} is-human: ${metadata['is-human']}`);
													}

													if(process.env.NODE_ENV !== 'development'){
														purgeAvailabilityCache(itemUUID)
															.catch(err => {
																debug(err);
															})
														;
													}
													audit({
														user : "ABSORBER",
														action : 'getAudioFile',
														article : itemUUID
													});
												})
											})
											.catch(err => {
												debug(err);
											})
										;

									} else if(err){
										debug(`An error occurred querying the S3 bucket for ${itemUUID}.mp3`, err);
									} else {
										debug(`The MP3 version of ${itemUUID} is already in the S3 bucket`);
									}

								});

								S3.headObject({
									Bucket : process.env.AWS_AUDIO_BUCKET,
									Key : `${itemUUID}.ogg`
								}, function(err){

									if ( (err && err.code === 'NotFound') || shouldOverwrite(databaseItem, metadata) ){
										debug(`We don't have an OGG version of ${itemUUID}. Creating conversion job now...`);

										if(!convert.check(itemUUID)){

											const localDestination = `${tmpPath}/${itemUUID}.mp3`;
											fetch(audioURL)
												.then(res => {
													const fsStream = fs.createWriteStream(localDestination);
													debug(`Writing .mp3 version of ${itemUUID} to ${localDestination} for conversion...`);

													return new Promise((resolve) => {

														fsStream.on('close', function(){
															debug(`${itemUUID}.mp3 has been written to ${localDestination}`);
															resolve();
														});

														res.body.pipe(fsStream);

													});

												})
												.then(function(){
													audit({
														user : 'ABSORBER',
														action : 'convertFileToOGG',
														article : itemUUID
													});
													return convert.ogg({
														filePath : localDestination,
														name : itemUUID
													});
												})
												.then(conversionDestination => {
													
													debug(`${itemUUID} has been converted to OGG and can be found at ${conversionDestination}`);
													debug(`Writing ${itemUUID}.ogg to S3`);

													fs.readFile(conversionDestination, (err, data) => {

														S3.putObject({
															Bucket : process.env.AWS_AUDIO_BUCKET,
															Key : `${itemUUID}.ogg`,
															Body : data,
															ACL : 'public-read'
														},function(err){
															
															if(err){
																debug(err);
															} else {
																debug(`${itemUUID}.ogg successfully uploaded to ${process.env.AWS_AUDIO_BUCKET}`);
																fs.unlink(conversionDestination, err => {
																	if(err){
																		debug(`Unable to delete ${conversionDestination} from file system`, err);
																	}
																});
																fs.unlink(localDestination, err => {
																	if(err){
																		debug(`Unable to delete ${localDestination} from file system`, err);
																	}
																});
																if(process.env.NODE_ENV !== 'development'){

																	purgeAvailabilityCache(itemUUID)
																		.catch(err => {
																			debug(err);
																		})
																	;
																
																}

																audit({
																	user : 'ABSORBER',
																	action : 'storeConvertedOGGToS3',
																	article : itemUUID
																});

															}


														})

													})

												})
												.catch(err => {
													debug(`An error occurred when we tried to convert ${itemUUID}.mp3 to OGG and upload it to S3`, err);
													fs.unlink(localDestination, err => {
														if(err){
															debug(`Unable to delete ${localDestination} for file system`, err);
														}
													});
													fs.unlink(`${tmpPath}/${itemUUID}.ogg`, err => {
														if(err){
															debug(`Unable to delete ${tmpPath}/${itemUUID}.ogg from file system`, err);
														}
													});
												})
											;

										} else {
											debug(`Job to convert ${itemUUID}.mp3 to OGG already exists`);
										}

									} else if(err){
										debug(`An error occurred querying the S3 bucket for ${itemUUID}.ogg`, err);
									} else {
										debug(`The OGG version of ${itemUUID} is already in the S3 bucket`);
									}

								});

							})
						;

					})
					.catch(err => {
						debug('Error checking file size', err);
					})
				;

			});
			
		})
		.catch(err => {
			debug(`An error occured trying to parse the feed from ${feedInfo.url}:`, '\n\terr:', err);
		})
	;

	const currentTime = new Date();

	// if(currentTime.getHours() === 13 && currentTime.getMinutes() < 10 && problemReportSent === false && problems.list().length > 0){
	if(!problemReportSent && problems.list().length > 0){
		problems.sendReport()
			.then(sentSuccesfully => {
				if(sentSuccesfully){
					problemReportSent = true;
				}
			})
		;
	}

}

function checkForData(){
	debug("Checking for data at", process.env.AUDIO_RSS_ENDPOINTS);
	audit({
		user : "ABSORBER",
		action : 'checkForAudioFiles'
	});

	const feeds = JSON.parse(process.env.AUDIO_RSS_ENDPOINTS).data;

	feeds.forEach(feedInfo => {
		getDataFromURL(feedInfo);
	});

}

function startPolling(interval, now){
	now = now || false;

	if(process.env.AUDIO_RSS_ENDPOINTS === undefined){
		debug("AUDIO_RSS_ENDPOINTS environment variable is undefined. Will not poll.");
		return false;
	}

	try{
		JSON.parse(process.env.AUDIO_RSS_ENDPOINTS).data;
	} catch(err){
		debug("Could not parse AUDIO_RSS_ENDPOINTS environment variable as JSON. Will not poll.");
		return;
	}

	if(process.env.AWS_AUDIO_BUCKET === undefined){
		debug('AWS_AUDIO_BUCKET environment variable is not defined. Will not poll.');
		return false;
	}

	poll = setInterval(checkForData, interval);
	if(now){
		checkForData();
	}

	return true;
}

function stopPolling(){
	clearInterval(poll);
}

module.exports = {
	poll : startPolling,
	stop : stopPolling
};