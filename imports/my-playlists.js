import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Session } from 'meteor/session';
import { HostedPlaylists } from './api/hosted-playlists.js';

import './my-playlists.html';

Template.my_playlists.onRendered(function playPageOnCreated() {
	var authToken = acquireSpotifyAccessToken(/* reacquire */false, /* queuedAction */ null);
	var userId = Session.get("jukebox-active-user-id");
  	this.subscribe('myPlaylists', userId, authToken);
});

Template.my_playlists.helpers({
  playlists(){
    return HostedPlaylists.find({}, {sort: { dateCreated: -1 }});
  }
});