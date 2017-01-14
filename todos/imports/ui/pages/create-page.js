import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Session } from 'meteor/session';
import { HostedPlaylists } from '../../api/playlists/hosted-playlists.js';

import './create-page.html';

// Components used inside the template
import './app-not-found.js';

Template.create_page.onCreated(function createPageOnCreated() {
  this.autorun(() => {
    // TODO
  });
});

Template.create_page.onRendered(function createPageOnRendered() {
  this.autorun(() => {
    // TODO
  });
});

Template.create_page.helpers({
});

Template.create_page.events({
  'click .js-new-playlist'() {
  	var playlistName = $('#playlist-name').val();

  	// TODO: pull from Spotify
  	var songs = [{
  		spotifyId: "spotify:track:2WMRd3xAb9FwXopCRNWDq1",
        name: "Song A",
        artist: "Artist A"
    }];
    var playlistId = HostedPlaylists.insert({
    	name: playlistName,
    	userId: Session.get("jukebox-active-user-id")
    })
    window.alert(playlistId);
    var newPlaylist = HostedPlaylists.findOne(playlistId);
  	newPlaylist.initializeSongs(songs);

  	window.alert("Success!");
    //FlowRouter.go('Lists.show', { _id: listId });
  },
});