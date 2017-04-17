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
	// adding body click event here since you can't add to elements via the meteor event framework
	$('body').click(function(event) {
		console.log($(event));
	   	if($('#header-right-button').hasClass("selected")) {
	 		if($(event.target).parents('#side-menu').length === 0 && $(event.target).parents('#header').length === 0){
	 			$("#side-menu").slideUp(200);
		  		$( "#header-right-button" ).removeClass( "selected" );
	 		}
	 	}
	});
});

Template.App_body.helpers({
  currentUser(){
    return Users.findOne();
  },
  isHomepage(){
	return (FlowRouter.getRouteName() == 'App.home');	
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
	'click #header-right-button'(event){
		if($('#header-right-button').hasClass("selected")) {
		  	$("#side-menu").slideUp(200);
		  	$( "#header-right-button" ).removeClass( "selected" );
		} else {
		  	$("#side-menu").slideDown(200);
		  	$( "#header-right-button" ).addClass( "selected" );
		}
	 },
	'click #header-left-button'(event){
		parent.history.back();
		return false;
	 }
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