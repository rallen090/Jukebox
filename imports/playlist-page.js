import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from './api/hosted-playlists.js';
import { Songs } from './api/songs.js';

import './playlist-page.html';

Template.playlist_page.onCreated(function playPageOnCreated() {
  this.getPlaylistId = () => parseInt(FlowRouter.getParam('_id'), 10);
});

Template.playlist_page.helpers({
  playlist() {
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({publicId: playlistId});
    return playlist;
  },
  songs() {
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({publicId: playlistId});
    return playlist ? playlist.songs() : [];
  },
  previousSongs() {
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({publicId: playlistId});
    return playlist ? playlist.previousSongs() : [];
  },
  currentSong(){
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({publicId: playlistId});

    if(!playlist.currentSongId){
      return null;
    }
    else{
      var song = Songs.findOne(playlist.currentSongId);
      return song;
    }
  },
  isFinished(){
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({publicId: playlistId});
    
    if(playlist.previousSongIds.length > 0 && !playlist.currentSong && playlist.songs().count() === 0){
      return true;
    }
    return false;
  },
  isOwner() {
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({ publicId: playlistId });

    // fall out if this playlist does not exist
    if(!playlist){
      return false;
    }

    var playlistUserId = playlist.userId;
    return playlistUserId === Session.get("jukebox-active-user-id");
  },
  hasVoted(votes){
    console.log(votes);
    var userId = Session.get("jukebox-active-user-id");
    return $.inArray(userId, votes) > -1;
  }
});

Template.playlist_page.events({
	
	'click .vote-action'(event) {
			
	  	var songId = event.currentTarget.id;
	  		  	
	  	var song = Songs.findOne({_id: songId});
	  	
      var userId = Session.get("jukebox-active-user-id");
	  	if(!song.didUserVote(userId)){
        song.vote(userId);
      }
      else{
        song.unvote(userId);
      }	
	 },
  'click .delete-action'(event){
    var songId = event.currentTarget.id;
    alert(songId);
    Songs.remove(songId);
  }
});
