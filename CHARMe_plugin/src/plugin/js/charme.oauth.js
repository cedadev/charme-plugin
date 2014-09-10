charme.oauth = {};
charme.oauth.init = function(){
	//Token params are passed to the page in the hash. This was in order to avoid interfering with data providers existing parameter handling.
	var params = charme.common.parameterise(window.location.hash.substring(1));
	var today = new Date();
	var expiryDate = new Date(today.getTime() + parseInt(params.expires_in));
	//var expiryDate = new Date(today.getTime() + 30000);
	//1: Construct message to send back to other window
	var msg = {
		//Token
		token: params.access_token,
		//Token Expiry
		expiry: expiryDate
	};
	
	if (!msg.token || msg.token===''){
		msg.error = "Can't login: Unable to retrieve authentication token";
	}

	//var msgStr = JSON.stringify(msg);
	//THIS NEEDS TO BE SORTED OUT LATER FOR SECURITY REASONS.
	//var originStr = window.location.protocol + '//' + window.location.host;

        //2: Send message back to opening window with the token
	//var msgStr = JSON.stringify(msg);
        charme.oauth.tokenMsg = JSON.stringify(msg);
        charme.oauth.originStr = window.location.protocol + '//' + window.location.host;

        if(charme.common.isIE11orLess) {
            charme.oauth.sendMessage(charme.oauth.tokenMsg, charme.oauth.originStr);
            window.close();
        }
        // If browser not IE, we use postMessage, with a handshake procedure to verify that window.opener - where we  
        // send the login token - is what it should be, and not a rogue entity that could intercept our token
        else {
            window.addEventListener('message', charme.oauth.handshake, false);
            charme.oauth.sendMessage('charme-handshake-request', charme.oauth.originStr);
        }
};

charme.oauth.sendMessage = function(msgStr, originStr) {
    if (window.opener){
            //If internet explorer, use broken method
            if (charme.common.isIE11orLess)
                    window.opener.charme.web.postMessageProxy(msgStr, originStr);
            else // Else use HTML5 standard method
                    window.opener.postMessage(msgStr, originStr);
            //window.close();
    }
    else{
            if (console.log){
                    console.log('Error communicating with opening client');
            }
    }
};

charme.oauth.handshake = function(evt) {
    if(evt.origin === window.location.protocol + '//' + window.location.host && evt.data) {
        if(evt.data === 'charme-handshake-established') {
            charme.oauth.sendMessage(charme.oauth.tokenMsg, charme.oauth.originStr);
            window.close();
        }
    }
};

/**
 * Will execute immediately (should rarely be used)
 */
charme.common.addEvent(window, 'load', charme.oauth.init);
