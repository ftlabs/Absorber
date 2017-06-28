
function generatePlainTextForEmail(data){
	return `
This email is being sent to ${data.recipients.join(", ")}.

The Business Development team (Kayode Josiah) is running an experiment with 3rd parties providing human-voiced audio files of FT articles (chosen by FirstFT, Andrew Jack). 

A new audio file has been retrieved from the 3rd party (${data.provider}).
for article ${data.itemUUID},
title: ${data.title}.

You can find the FT copy at 
${data.ftCopyUrl}

and the 3rd party copy is at 
${data.partnerCopyUrl}.

The audio management page is
${data.managementURL}
`;

}

function generateHTMLForEmail(data){
	return `
<p>
This email is being sent to ${data.recipients.join(", ")}.
</p>
<p>
The Business Development team (Kayode Josiah) is running an experiment with 3rd parties providing human-voiced audio files of FT articles (chosen by FirstFT, Andrew Jack). 
</p>
<p>
A new audio file has been retrieved from the 3rd party (${data.provider}).
</p>
<p>
for article ${data.itemUUID},
<br>
title: ${data.title}.
</p>
<p>
You can find the FT copy at 
<br>
<a href="${data.ftCopyUrl}">${data.ftCopyUrl}</a>.
</p>
<p>
and the 3rd party's copy at 
<br>
<a href="${data.partnerCopyUrl}">${data.partnerCopyUrl}</a>.
</p>
<p>
The audio management page is <a href="${data.managementURL}">here</a>.
</p>
`;
}

module.exports = {
	plaintext : generatePlainTextForEmail,
	html : generateHTMLForEmail
};