import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from './api/hosted-playlists.js';
import { Songs } from './api/songs.js';
import { Users } from './api/users.js';

import './playlist-page.html';

Template.playlist_page.onCreated(function playPageOnCreated() {
  this.getPlaylistId = () => FlowRouter.getParam('_id');

  this.subscribe('currentPlaylist', this.getPlaylistId());
});

Template.playlist_page.onRendered(function playlistPageOnRendered(){
  // set up animations (in timeout to allow for load time)
  var self = this;
  setTimeout(function(){
    self.find('.playlistContainer ul')._uihooks = {
      insertElement: function (node) {
        $(node).insertAfter($(".playlistContainer li").last()).hide().show('fast');

        // this is hacky - but for some reason, if this page loads with zero songs then the animations/sorting is broken
        // once more songs are added. if the page on-load has songs, though, it is fine. so we just force a reload after the first song...
        if($(".song-row").length === 1){
          location.reload();
        }
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
  }, 1000);

  tryExecuteQueuedAction({savePlaylist: () => {
    $("#save-action").prop('disabled', true);
    $("#save-action").css('color', 'white');
  }});

});

Template.playlist_page.helpers({
  playlist() {
    return HostedPlaylists.findOne();
  },
  songs() {
    var playlist = HostedPlaylists.findOne();
    return playlist ? playlist.songs() : [];
  },
  previousSongs() {
    var playlist = HostedPlaylists.findOne();
    return playlist ? playlist.previousSongs() : [];
  },
  currentSong(){
    var playlist = HostedPlaylists.findOne();

    if(!playlist || !playlist.currentSongId){
      return null;
    }
    else{
      var song = Songs.findOne(playlist.currentSongId);
      return song;
    }
  },
  isFinished(){
    var playlist = HostedPlaylists.findOne();

    if(playlist && playlist.previousSongIds.length > 0 && !playlist.currentSong && playlist.songs().count() === 0){
      return true;
    }
    return false;
  },
  hasPastSongs(){
    var playlist = HostedPlaylists.findOne();
    return playlist && playlist.previousSongIds.length > 0 && playlist.previousSongs().count() !== 0;
  },
  isOwner() {
    var playlist = HostedPlaylists.findOne();

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

    // to avoid private/public concerns, the share link just used whatever the current URL has since the user has it
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var shareMessage = "Join the Jukebox: " + "www." + window.location.host + "/p/" + playlistId;

    // android
    if (/android/i.test(userAgent)) {
        console.log("Android " + shareMessage);
        return "sms:?body=" + shareMessage;
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        console.log("iOS " + shareMessage);
        return "sms:&body=" + shareMessage;
    }

    return "mailto:?body=" + shareMessage + "&subject=JukeboxInvite";
  },
  getHostToken(){
    var playlist = HostedPlaylists.findOne();

    if(!playlist){
      return null;
    }

    var playlistId = playlist._id;
    var authToken = Session.get("jukebox-spotify-access-token");
    var hostToken = ReactiveMethod.call('getHostToken', playlistId, authToken);
    return hostToken;
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
  },
  'click #save-action'(event) {
    var playlist = HostedPlaylists.findOne();
    var playlistId = playlist._id;

    var songIds = [];
    Songs.find({hostedPlaylistId: playlistId}).forEach(function(row){
        songIds.push(row.spotifyId);
    });
    
    if(songIds.length > 0){
      savePlaylist(playlist.name, songIds, function(){
        $("#save-action").prop('disabled', true);
        $("#save-action").css('color', 'white');
      });
    }
  }
});