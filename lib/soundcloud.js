/**
* Node.js Soundcloud API
* Structure heavily influnced by twitter-js
* 
* 2011 Logan Aube
*
*/
 
var url = require("url"),
http = require('http'),
OAuth = require('oauth').OAuth,
querystring = require("querystring");
 
module.exports = function(api_key, api_secret, redirect, sandbox) {
  var domain = sandbox ? 'sandbox-soundcloud' : 'soundcloud';
  var client = {version: '0.0.1'},
  
  // Private
  
  oAuth = new OAuth(
    'http://api.'+domain+'.com/oauth/request_token',
    'http://api.'+domain+'.com/oauth/access_token',
    api_key,
    api_secret,
    '2.0',
    redirect,
    'HMAC-SHA1',
    null,
    {'Accept': '*/*', 'Connection': 'close', 'User-Agent': 'node-soundcloud'}
    ),
  
  rest_base = 'http://api.'+domain+'.com/',
  
  requestCallback = function (callback) {
    return function (error, data, response) {
      if(error) {
        callback(error, null);
      } else {
        try {
          callback(null, JSON.parse(data));
        } catch (exc) {
          callback(exc, null);
        }
      }
    }
  },
  
  get = function(path, params, token, callback) {
    oAuth.get(rest_base + path + '?' + querystring.stringify(params), token.oauth_token, token.oauth_token_secret, requestCallback(callback));
  },
  
  post = function(path, params, token, callback) {
    oAuth.post(rest_base + path, token.oauth_token, token.oauth_token_secret, params, null, requestCallback(callback));
  };
  
  // Public
  
  client.apiCall = function(method, path, params, callback) {
    var token = params.token;
    
    delete params.token;
    
    if(method === 'GET') {
      get(path+'.json', params, token, callback);
    } else if (method === 'POST') {
      post(path+'.json', params, token, callback);
    }
  };
  
  client.getAccessToken = function(req, res, callback) {
    
    var parsedUrl = url.parse(req.url, true);
    
    // Access token
    if(parsedUrl.query && parsedUrl.query.oauth_token && req.session.auth && req.session.auth.soundcloud_oauth_token_secret) {
      oAuth.getOAuthAccessToken(
        parsedUrl.query.oauth_token,
        req.session.auth.soundcloud_oauth_token_secret,
        parsedUrl.query.oauth_verifier,
        function (error, oauth_token, oauth_token_secret, additionalParameters) {
          if (error) {
            callback(null, null);
          } else {
            callback(null, {oauth_token: oauth_token, oauth_token_secret: oauth_token_secret});
          }
        }
        );
 
      // Request token  
    } else {
      oAuth.getOAuthRequestToken(
        function (error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters) {
          if (!error) {
            req.session.twitter_redirect_url = req.url;
            req.session.auth = req.session.auth || {};
            req.session.auth.soundcloud_oauth_token_secret = oauth_token_secret;
            req.session.auth.soundcloud_oauth_token = oauth_token;
            res.redirect("http://"+domain+".com/oauth/authorize?oauth_token="+oauth_token);
          } else {
	    callback(error, null);
	  }
          callback(null, null);
        }
      ); 
    }
    
  };
  
  return client;
};