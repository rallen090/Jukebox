import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { Session } from 'meteor/session';
import { Users } from '../../api/users/users.js';
import { HostedPlaylists } from '../../api/playlists/hosted-playlists.js';
import { Songs } from '../../api/songs/songs.js';
import { Lists } from '../../api/lists/lists.js';

// Import to load these templates
import '../../ui/layouts/app-body.js';
import '../../ui/pages/root-redirector.js';
import '../../ui/pages/lists-show-page.js';
import '../../ui/pages/app-not-found.js';

// jukebox templates
import '../../ui/pages/create-page.js';
import '../../ui/pages/playlist-page.js';
import '../../ui/pages/debug.js';

// Import to override accounts templates
import '../../ui/accounts/accounts-templates.js';

FlowRouter.route('/lists/:_id', {
  name: 'Lists.show',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'Lists_show_page' });
  },
});

FlowRouter.route('/', {
  name: 'App.home',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'app_rootRedirector' });
  },
});

// ---- Jukebox Routes ----

FlowRouter.route('/jukebox/', {
  name: 'Jukebox.home',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'app_rootRedirector' });
  },
});

FlowRouter.route('/jukebox/create/', {
  name: 'Jukebox.create',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'create_page' });
  },
});

FlowRouter.route('/jukebox/join/', {
  name: 'Jukebox.join',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'app_rootRedirector' });
  },
});

FlowRouter.route('/jukebox/playlist/:_id', {
  name: 'Jukebox.playlist',
  triggersEnter: [acquireSession],
  action() {
    BlazeLayout.render('App_body', { main: 'playlist_page' });
  },
});

FlowRouter.route('/jukebox/debug/', {
  name: 'Jukebox.debug',
  action() {
    BlazeLayout.render('App_body', { main: 'debug_page' });
  },
});

// the App_notFound template is used for unknown routes and missing lists
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body', { main: 'App_notFound' });
  },
};

// trigger for managing session across routes
function acquireSession() {
  const sessionKey = "jukebox-active-user-id";
  var userIdFromSession = Session.get(sessionKey);
  if(!userIdFromSession){
    var userId = Users.createNewUser(null);
    Session.setPersistent(sessionKey, userId);
  }
};