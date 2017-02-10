import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
 
import './auth.html';

Template.auth_page.onRendered(function authOnRendered(){
	// get the returned spotify token and persist it
    function getHashValue(key) {
      var matches = location.hash.match(new RegExp(key+'=([^&]*)'));
      return matches ? matches[1] : null;
    }
    var token = getHashValue('access_token');

    // handle the token
    Session.setPersistent("jukebox-spotify-access-token", token);

    // persist auth token with the userid so that we can link the two
    const sessionKey = "jukebox-active-user-id";
    var userIdFromSession = Session.get(sessionKey);
    // if the token matches an existing user, we switch to that new userId to keep in sync  
    //var updatedUserId = Users.updateUserWithAuthToken(userIdFromSession, token);
    var updatedUserId = ReactiveMethod.call('updateUserWithAuthToken', userIdFromSession, token);
    Session.setPersistent(sessionKey, updatedUserId);

    // then read back our redirect so we can return to wherever we were
    const redirectKey = "jukebox-spotify-auth-redirect";
    var originalUrl = Session.get(redirectKey);
    Session.clear(redirectKey);

    if(!originalUrl){
      window.location = window.location.protocol + "//" + window.location.host + "/create?useSpotify=false";
    }
    else{
      window.location = originalUrl;
    }
});