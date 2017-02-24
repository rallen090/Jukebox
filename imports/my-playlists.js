import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Session } from 'meteor/session';
import { HostedPlaylists } from './api/hosted-playlists.js';

import './my-playlists.html';

Template.my_playlists.onRendered(function playPageOnCreated() {
	var authToken = acquireSpotifyAccessToken(/* reacquire */false, /* queuedAction */ null);
	var userId = Session.get("jukebox-active-user-id");
  	this.subscribe('myPlaylists', userId, authToken);
  	setTimeout(() => {
	  	$("li").on("swipe",function(event){
		  alert("This will delete one day...");
		});
  	}, 1000);
});

Template.my_playlists.helpers({
  playlists(){
    return HostedPlaylists.find({}, {sort: { dateCreated: -1 }});
  },
  dateAsTimeSince(date){
    return timeSince(date);
  },
});

Template.my_playlists.events({
  'click li'(event) {
    // get the public id - we store the public id on the rows of the list so it is easy to grab it when a row is clicked
    var playlistId = event.target.id;

    if(!playlistId){
		window.location = window.location.protocol + "//" + window.location.host + "/create?useSpotify=true";
    }
    else{
    	FlowRouter.go('Jukebox.playlist', { _id: playlistId });
    }
  },
});

function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " yrs";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hrs";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " mins";
    }
    return Math.floor(seconds) + " secs";
};