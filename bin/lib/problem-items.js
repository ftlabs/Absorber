const debug = require('debug')('bin:lib:problem-items');
const mailer = require('./mailer');

const itemsWithIssues = {};
const recipients = process.env.ISSUE_REPORT_RECIPIENTS.split(',') || [];
const reportedItems = {};

function addItemWithAProblemToList(key, reason = ''){
	itemsWithIssues[key] = reason;
}

function getASingleItemWithAProblemFromList(key){
	if(!key){
		return undefined;
	} else {
		return itemsWithIssues[key];
	}
}

function checkIfItemHasAlreadyBeenReported(key){
	return reportedItems[key] === true;
}

function listAllItemsWithProblems(){
	return Object.keys(itemsWithIssues);
}

function reportAnIssueToInterestedParties(key){

	if(recipients.length < 1){
		return {
			wasSent : false,
			reason : `Unable to send report for ${key}. There are no recipients to send the report to.`
		};
	}

	if(reportedItems[key] !== undefined){
		return {
			wasSent : false,
			reason : `Report has already been sent for ${key}. There are no recipients to send the report to.`
		};
	}

	const intro = `This is an automated message from the FT Labs Audio Absorber. There is an issue with the audio for article ${key}.`
	let listedIssues = `The issues are as follows: ${itemsWithIssues[key]}`;
	const outro = 'Please address these issues as soon as is convenient.';

	const combinedMessage = `${intro} ${listedIssues} ${outro}`;
	const combinedHTMLMessage = `<p>${intro}</p><p>${listedIssues}</p><p>${outro}</p>`;

	return mailer.sendCustomMessage(
			recipients,
			'Issues with 3rd party audio acquisition',
			combinedMessage,
			combinedHTMLMessage
		)
		.then(wasOK => {
			if(wasOK){
				console.log('Issues report successfully sent to:', recipients.join(', '));
				reportedItems[key] = true;
			}
			return wasOK;
		})
		.catch(err => {
			console.log('An error occurred trying to send an issues report to', recipients.join(', '), err);
			return false;
		})
	;

}

module.exports = {
	add : addItemWithAProblemToList,
	get : getASingleItemWithAProblemFromList,
	check : checkIfItemHasAlreadyBeenReported,
	list : listAllItemsWithProblems,
	report : reportAnIssueToInterestedParties,
};
