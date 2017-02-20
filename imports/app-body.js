/* global alert */

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { $ } from 'meteor/jquery';

import { Users } from '../imports/api/users.js';

import './services/spotify.js';

import './app-body.html';

Meteor.startup(() => {

});

Template.App_body.onCreated(function appBodyOnCreated() {
	var authToken = Session.get("jukebox-spotify-access-token");
	var userId = Session.get("jukebox-active-user-id");
	this.subscribe('currentUser', userId, authToken, {onReady: function(){
		syncUser();
	}});
	setTimeout(syncUser, 1000);
});

Template.App_body.onRendered(function appBodyOnRendered(){
});

Template.App_body.helpers({
  currentUser(){
    return Users.findOne();
  }
});

Template.App_body.events({
	'click #user-log-in'(event) {
		acquireSpotifyAccessToken(/*reacquire*/ true, /*queuedAction*/ null);
	},
	'click #user-log-out'(event) {
		Session.clear("jukebox-spotify-access-token");
		Session.clear("jukebox-active-user-id");
		location.reload();
	},
	'click #user-my-playlists'(event) {
		FlowRouter.go('Jukebox.playlists');
	},
});

function syncUser(){
		var user = Users.findOne();

		// sync auth if we have a token but no user returned
		var authToken = Session.get("jukebox-spotify-access-token");
		if(!user && authToken){
			acquireSpotifyAccessToken(/*reacquire*/ true, /*queuedAction*/ null);
		}

		// initialize the drop down for login as well
		$('.ui.dropdown').dropdown();
};