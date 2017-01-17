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

Template.playlist_page.onRendered(function playlistPageOnRendered(){
      this.find('ul')._uihooks = {
        insertElement: function (node) {
          // insert logic
          $(this).append(node);
        },
        removeElement: function (node) {
            //Remove logic
            $(node).animate({ height: 'toggle', opacity: 'toggle' }, 'fast');
        },
        moveElement: function (node, next) {
            //move logic
            $(node).animate({ height: 'toggle', opacity: 'toggle' }, 'fast').promise().done(function(){
              $(node).insertBefore(next).animate({ height: 'toggle', opacity: 'toggle' }, 'fast');
            });
        } 
    };
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
  hasPastSongs(){
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({publicId: playlistId});
    return playlist.previousSongIds.length > 0 && playlist.previousSongs().count() !== 0;
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
    var userId = Session.get("jukebox-active-user-id");
    return $.inArray(userId, votes) > -1;
  },
  hasVotedClass(votes){
    var userId = Session.get("jukebox-active-user-id");
    return $.inArray(userId, votes) > -1 ? "fa fa-star" : "fa fa-star-o";
  },
  getShareLinkByOS(){
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var shareMessage = "Join the Jukebox: " + window.location.protocol + "//" + window.location.host + "/p/" + playlistId;

    // android
    if (/android/i.test(userAgent)) {
        console.log("Android " + shareMessage);
        return "sms:1234?body=" + shareMessage;
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        console.log("iOS " + shareMessage);
        return "sms:1234&body=" + shareMessage;
    }

    return "mailto:test@mail.com?body=" + shareMessage + "&subject=JukeboxInvite";
  }
});

Template.playlist_page.events({
	
	'click .vote-action'(event) {
			
	  	var songId = event.currentTarget.id;

      if(!songId){
        return;
      }
	  		  	
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
    Songs.remove(songId);
  }
});
