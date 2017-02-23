import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';

import { Users } from '../imports/api/users.js';
import { HostedPlaylists } from '../imports/api/hosted-playlists.js';
import { Songs } from '../imports/api/songs.js';

import '../imports/create-page.js';
import '../imports/playlist-page.js';
import '../imports/my-playlists.js';
import '../imports/host.js';
import '../imports/welcome.js';
import '../imports/debug.js';
import '../imports/search.js';
import '../imports/auth.js';
import '../imports/settings.js';
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

FlowRouter.route('/p/:_id/settings', {
  name: 'Jukebox.settings',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'settings_page' });
  },
});

FlowRouter.route('/playlists', {
  name: 'Jukebox.playlists',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'my_playlists' });
  },
});

FlowRouter.route('/host', {
  name: 'Jukebox.host',
  action() {
    // for redirecting to app or app store
    BlazeLayout.render('host_page');
  },
});

FlowRouter.route('/spotify/auth/', {
  name: 'Jukebox.spotify',
  action() {
    // RTA: contains auth JS logic - which we need a template for because otherwise we can't access subscriptions here in this action
    BlazeLayout.render('auth_page');
  },
});

// special case for android for handling app store redirect if not installed
FlowRouter.route('/android/', {
  name: 'Jukebox.android',
  action() {
    window.location.href = "market://details?id=com.facebook.katana";
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
      var authToken = Session.get("jukebox-spotify-access-token");

      // get a user if no session is set
      if(!userIdFromSession && !authToken){
        Meteor.call('syncUserWithServer', userIdFromSession, /* token */ null, function(error, result){
          Session.setPersistent(sessionKey, result);
        });
      }
  }
};