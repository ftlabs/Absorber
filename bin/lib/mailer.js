const debug = require('debug')('bin:lib:mailer');
const fetch = require('node-fetch');
const assert = require('assert');

// email api via https://email-webservices.ft.com/docs/email-simple/#api-Send-Post_send_by_address

[
	'MAIL_RECIPIENTS',
	'MAIL_FROM_SUBDOMAIN',
	'MAIL_FROM_PREFIX',
	'MAIL_FROM_NAME',
	'MAIL_POST_URL',
	'MAIL_POST_AUTH_TOKEN'
].forEach(function(p){
	assert(process.env[p], `missing env param: ${p}`);
});

const from_email_subdomain = process.env.MAIL_FROM_SUBDOMAIN;
const from_email_prefix    = process.env.MAIL_FROM_PREFIX;
const from_email_name      = process.env.MAIL_FROM_NAME;
const mail_post_url        = process.env.MAIL_POST_URL;
const mail_post_auth_token = process.env.MAIL_POST_AUTH_TOKEN;

const from_email_address   = `${from_email_prefix}@${from_email_subdomain}`;
const defaultSubject       = 'Audio file retrieved from 3rd parties';

function sendCustomMessageToSpecifiedRecipients(recipients = [], subject, plainText, htmlContent, ingestionUUID = 'custom-message'){

	if(!recipients || recipients.length < 1){
		return Promise.reject('No recipients passed. Message not sent');
	}

	const post_body_data = {
		transmissionHeader: {
			description: 'Custom FT Labs Absorber email',
		    metadata: {
		        audioArticleIngestionUuid: ingestionUUID
		    },
		},
		to: {
		    address: recipients
		},
		from: {
		    address: from_email_address,
		    name:    from_email_name
		},
		subject:          subject,
		htmlContent:      htmlContent,
		plainTextContent: plainText
	};

	return fetch(mail_post_url, {
			method       : 'POST', 
			body         :  JSON.stringify(post_body_data),
			headers      : {
				'Content-Type'  : 'application/json',
				'Authorization' : mail_post_auth_token
			}
		})
		.then(res => {
			if(!res.ok){
				throw res;
			} else {
				return res;
			}
		})
		.then(res => res.text())
		.then(response => debug(response))
		.then(function(){
			return true;
		})
		.catch(err => {
			debug('An error occurred sending a custom email', err);
			return false;
		})
	;

}

module.exports = {
	sendCustomMessage : sendCustomMessageToSpecifiedRecipients
};