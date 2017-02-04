import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';

import { Users } from '../imports/api/users.js';
import { HostedPlaylists } from '../imports/api/hosted-playlists.js';
import { Songs } from '../imports/api/songs.js';

import '../imports/create-page.js';
import '../imports/playlist-page.js';
import '../imports/welcome.js';
import '../imports/debug.js';
import '../imports/search.js';
import '../imports/app-body.js';

FlowRouter.route('/', {
  name: 'App.home',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'welcome_page' });
  },
});

FlowRouter.route('/home/', {
  name: 'App.home',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'welcome_page' });
  },
});

FlowRouter.route('/jukebox/', {
  name: 'Jukebox.home',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'create_page' });
  },
});

FlowRouter.route('/create/', {
  name: 'Jukebox.create',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'create_page' });
  },
});

FlowRouter.route('/join/', {
  name: 'Jukebox.join',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'create_page' });
  },
});

FlowRouter.route('/playlist/:_id', {
  name: 'Jukebox.playlist',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'playlist_page' });
  },
});

FlowRouter.route('/p/:_id', {
  name: 'Jukebox.playlist',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'playlist_page' });
  },
});

FlowRouter.route('/spotify/auth/', {
  name: 'Jukebox.spotify',
  action() {
    // get the returned spotify token and persist it
    function getHashValue(key) {
      var matches = location.hash.match(new RegExp(key+'=([^&]*)'));
      return matches ? matches[1] : null;
    }
    var token = getHashValue('access_token');

    // handle the token
    Session.setPersistent("jukebox-spotify-access-token", token);

    // TODO: persist token to our DB so we can use it as an auth token

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
  },
});

FlowRouter.route('/debug/', {
  name: 'Jukebox.debug',
  action() {
    BlazeLayout.render('App_body', { main: 'debug_page' });
  },
});

FlowRouter.route('/search/', {
  name: 'Jukebox.search',
  action() {
    BlazeLayout.render('search', { main: 'search' });
  },
});

FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body');
  },
};

// trigger for managing session across routes
function acquireSession() {
  const sessionKey = "jukebox-active-user-id";
  var userIdFromSession = Session.get(sessionKey);
  
  // NOTE: we perform the session storage logic on a delay because this is run before the client is sent the actual 
  // server-side data, which we need to check against for user info
  setTimeout(function(){
    // if there is no session stored OR the session is not a userId we recognize, set the session  
    if(!userIdFromSession /* || Users.find(userIdFromSession).count() === 0*/){ // TODO: re-evaluate this - it still creates unneeded users all the time
      var userId = Users.createNewUser();
      Session.setPersistent(sessionKey, userId);
    }
  }, 0);
};