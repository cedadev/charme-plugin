charme.oauth = {};
charme.oauth.init = function(){
	//Token params are passed to the page in the hash. This was in order to avoid interfering with data providers existing parameter handling.
	var params = charme.common.parameterise(window.location.hash.substring(1));
	//Construct message to send back to other window
	var msg = {
		//Token
		authToken: params.access_token,
		//Token Expiry
		authExpiry: params.expires_in
	};
	
	if (!msg.authToken || msg.authToken===''){
		msg.error = 'Unable to retrieve authentication token';
	}
		
	var msgStr = JSON.stringify(msg);
	//THIS NEEDS TO BE SORTED OUT LATER FOR SECURITY REASONS.
	var originStr = window.location.protocol + '//' + window.location.host;
	
	//2. Send message back to opening window with the token
	if (window.opener)
		window.opener.postMessage(msgStr, originStr);
	else{
		if (console.log){
			console.log('Error communicating with opening client');
		}
	}
		
};

/**
 * Will execute immediately (should rarely be used)
 */
(function(){
	charme.common.addEvent(window, 'load', charme.oauth.init);
})();