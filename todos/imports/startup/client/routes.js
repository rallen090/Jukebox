import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { Session } from 'meteor/session';
import { Users } from '../../api/users/users.js';

// Import to load these templates
import '../../ui/layouts/app-body.js';
import '../../ui/pages/root-redirector.js';
import '../../ui/pages/lists-show-page.js';
import '../../ui/pages/app-not-found.js';

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
    BlazeLayout.render('App_body', { main: 'app_rootRedirector' });
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
    BlazeLayout.render('App_body', { main: 'app_rootRedirector' });
  },
});

// the App_notFound template is used for unknown routes and missing lists
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body', { main: 'App_notFound' });
  },
};

function acquireSession() {
  const sessionKey = "jukebox-active-user-id";
  var userIdFromSession = Session.get(sessionKey);
  if(!userIdFromSession){
    // var userId = Users.createNewUser();
    // Session.setPersistent(sessionKey, userId);
  }
};