import { Meteor } from 'meteor/meteor';
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
import '../imports/auth.js';
import '../imports/app-body.js';

Meteor.subscribe('jukeboxUsers');

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
    // RTA: contains auth JS logic - which we need a template for because otherwise we can't access subscriptions here in this action
    BlazeLayout.render('App_body', { main: 'auth_page' });
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
  if(Meteor.isClient){
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
  }

};