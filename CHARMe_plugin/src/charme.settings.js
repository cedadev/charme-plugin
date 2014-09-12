"use strict";

/**
 * Site-specific settings.
 */


if (typeof charme==='undefined'){
	var charme={};
}

if (!charme.settings) {
	charme.settings = {};
}

/*
 charme.settings.REMOTE_BASE_URL = The base URL of CHARMe Node
 charme.settings.AUTH_BASE_URL = Base URL of auth provider. Typically the same as the Node
 charme.settings.AUTH_CLIENT_ID=The client ID is used to identify the integrator's site where a CHARMe Node is supporting multiple data providers
 charme.settings.AUTH_PATH=The path relative to AUTH_BASE_URL where the authorization service is hosted
 charme.settings.AUTH_RESPONSE_TYPE=What the authorization service should do upon successful authorization. Only 'token' is supported for now.
*/

charme.settings.REMOTE_BASE_URL='https://charme-dev.cems.rl.ac.uk/';
charme.settings.AUTH_BASE_URL=charme.settings.REMOTE_BASE_URL;
charme.settings.AUTH_CLIENT_ID='12345';
charme.settings.AUTH_PATH='/oauth2/authorize';
charme.settings.AUTH_RESPONSE_TYPE='token';