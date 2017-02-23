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
	self = this;
	self.subscribe('currentUser', userId, authToken, {onReady: function(){
		syncUser(self);
	}});
});

Template.App_body.onRendered(function appBodyOnRendered(){
	// $('body').append('<div class="ui left demo vertical inverted sidebar labeled icon menu">\
 //        <a class="item">\
 //          <i class="home icon"></i>\
 //          Home\
 //        </a>\
 //        <a class="item">\
 //          <i class="block layout icon"></i>\
 //          Topics\
 //        </a>\
 //        <a class="item">\
 //          <i class="smile icon"></i>\
 //          Friends\
 //        </a>\
 //      </div>');
	// $('#__blaze-root').addClass("pusher");
	// $('.context.example .ui.sidebar')
 //  .sidebar({
 //    context: $('.context.example .bottom.segment')
 //  })
 //  .sidebar('attach events', '.context.example .menu .item');
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
		location.reload(true);
	},
	'click #user-my-playlists'(event) {
		FlowRouter.go('Jukebox.playlists');
	},
	// 'click #side-menu'(event){
	// 	$('.sidebar').sidebar('toggle');
	// }
});

function syncUser(self){
		var user = Users.findOne();

		// sync auth if we have a token but no user returned
		const sessionKey = "jukebox-active-user-id";
		var authToken = Session.get("jukebox-spotify-access-token");
		if(!user && authToken){
			Meteor.call('syncUserWithServer', /* userId */ null, authToken, function(error, result){
				// if syncing did not return a valid userId AND we have an auth token, then force a re-auth
				if(result == null){
					acquireSpotifyAccessToken(/* reaquire */ true, /*queuedAction*/ null);
					return;
				}

				// otherwise, set the user ID
				Session.setPersistent(sessionKey, result);

				// re-sub after re-auth
				var authToken = Session.get("jukebox-spotify-access-token");
				var userId = Session.get("jukebox-active-user-id");
				self.subscribe('currentUser', userId, authToken);
			});
		}

		// initialize the drop down for login as well
		$('.ui.dropdown').dropdown();
};