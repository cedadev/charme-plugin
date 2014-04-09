charme.oauth = {};
charme.oauth.init = function(){
	//Token params are passed to the page in the hash. This was in order to avoid interfering with data providers existing parameter handling.
	var params = charme.common.parameterise(window.location.hash.substring(1));
	var today = new Date();
	var expiryDate = new Date(today.getTime() + parseInt(params.expires_in));
	//var expiryDate = new Date(today.getTime() + 30000);
	//Construct message to send back to other window
	var msg = {
		//Token
		token: params.access_token,
		//Token Expiry
		expiry: expiryDate
	};
	
	if (!msg.token || msg.token===''){
		msg.error = 'Unable to retrieve authentication token';
	}
		
	var msgStr = JSON.stringify(msg);
	//THIS NEEDS TO BE SORTED OUT LATER FOR SECURITY REASONS.
	var originStr = window.location.protocol + '//' + window.location.host;
	
	//2. Send message back to opening window with the token
	if (window.opener){
		//If internet explorer, use broken method
		if (charme.common.isIE11orLess)
			window.opener.charme.web.postMessageProxy(msgStr, originStr);
		else // Else use HTML5 standard method
			window.opener.postMessage(msgStr, originStr);
		window.close();
	}
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