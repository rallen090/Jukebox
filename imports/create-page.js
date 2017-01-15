import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Session } from 'meteor/session';
import { HostedPlaylists } from './api/hosted-playlists.js';

import './services/spotify.js';

import './create-page.html';

// storing playlists in a client-side meteor collection so they can load and be rendered dynamically (i.e. won't block page load)
var SpotifyPlaylists = new Meteor.Collection(null);

Template.create_page.onCreated(function createPageOnCreated() {
  this.autorun(() => {
    // populate playlists
    getUserPlaylists(function(response){
      var items = response.items;
      $.each(items, function( index, value ) {
        SpotifyPlaylists.insert({
          spotifyId: value.id,
          name: value.name,
          imgUrl: value.images.url,
          songCount: value.tracks.total
        });
      });
    })
  });
});

Template.create_page.onRendered(function createPageOnRendered() {
  this.autorun(() => {
  });
});

Template.create_page.helpers({
  playlists(){
    return SpotifyPlaylists.find();
  }
});

Template.create_page.events({
  'click #js-new-playlist'() {
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
    var newPlaylist = HostedPlaylists.findOne(playlistId);
  	newPlaylist.initializeSongs(songs);
    
    FlowRouter.go('Jukebox.playlist', { _id: newPlaylist.publicId });
  },
});