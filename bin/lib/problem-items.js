const debug = require('debug')('bin:lib:problem-items');
const mailer = require('./mailer');

const itemsWithIssues = {};
const recipients = process.env.ISSUE_REPORT_RECIPIENTS.split(',') || [];

function addItemWithAProblemToList(key, reason = ''){
	itemsWithIssues[key] = reason;
}

function removeItemWithProblemFromList(key){
	delete itemsWithIssues[key]
}

function getASingleItemWithAProblemFromList(key){
	if(!key){
		return undefined;
	} else {
		return itemsWithIssues[key];
	}
}

function listAllItemsWithProblems(){
	return Object.keys(itemsWithIssues);
}

function sendAReportToInterestedPartiesOfIssues(){

	if(recipients.length < 1){
		return 'Unable to send report. There are no recipients to send the report to.';
	}

	const intro = `This is an automated message from the FT Labs Audio Absorber. There are some issues with items that we've tried to absorb from our 3rd party providers...`
	let listedIssues = '';
	const outro = '\nPlease address these issues as soon as is convenient.';

	Object.keys(itemsWithIssues).forEach(key => {
		listedIssues += '\n' + key + ': ' + itemsWithIssues[key];	
	});

	const combinedMessage = intro + listedIssues + outro;

	return mailer.sendCustomMessage(
		recipients,
		'Issues with 3rd party audio acquisition', 
		combinedMessage, 
		combinedMessage
	)
		.then(wasOK => {
			if(wasOK){
				debug('Issues report successfully sent to:', recipients.join(', '));
			}
			return wasOK;
		})
		.catch(err => {
			debug('An error occurred trying to send an issues report to', recipients.join(', '), err);
			return false;
		})
	;

}

module.exports = {
	add : addItemWithAProblemToList,
	remove : removeItemWithProblemFromList,
	get : getASingleItemWithAProblemFromList,
	list : listAllItemsWithProblems,
	sendReport : sendAReportToInterestedPartiesOfIssues
};