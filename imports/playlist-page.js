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
});

Template.playlist_page.onRendered(function playlistPageOnRendered(){
  // set up animations
  this.find('.playlistContainer ul')._uihooks = {
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

  tryExecuteQueuedAction({savePlaylist: () => {
    $("#save-action").prop('disabled', true);
    $("#save-action").css('color', 'white');
  }})

});

Template.playlist_page.helpers({
  playlist() {
    return getPlaylistForTemplate();
  },
  songs() {
    var playlist = getPlaylistForTemplate();
    return playlist ? playlist.songs() : [];
  },
  previousSongs() {
    var playlist = getPlaylistForTemplate();
    return playlist ? playlist.previousSongs() : [];
  },
  currentSong(){
    var playlist = getPlaylistForTemplate();

    if(!playlist.currentSongId){
      return null;
    }
    else{
      var song = Songs.findOne(playlist.currentSongId);
      return song;
    }
  },
  isFinished(){
    var playlist = getPlaylistForTemplate();

    if(playlist.previousSongIds.length > 0 && !playlist.currentSong && playlist.songs().count() === 0){
      return true;
    }
    return false;
  },
  hasPastSongs(){
    var playlist = getPlaylistForTemplate();
    return playlist.previousSongIds.length > 0 && playlist.previousSongs().count() !== 0;
  },
  isOwner() {
    var playlist = getPlaylistForTemplate();

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
    var shareMessage = "Join the Jukebox: " + window.location.protocol + "//" + window.location.host + "/p/" + playlistId;

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
    var playlist = getPlaylistForTemplate();
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
    var playlistName = $("#playlist-name").text().trim();
    var playlist = getPlaylistForTemplate();
    var playlistId = playlist.publicId;
    var songIds = [];
    Songs.find({hostedPlaylistId: playlistId}, {spotifyId: 1}).forEach(function(row){
        songIds.push(row.spotifyId);
    });
    if(songIds.length > 0){
      savePlaylist(playlistName, songIds, function(){
        $("#save-action").prop('disabled', true);
        $("#save-action").css('color', 'white');
      });
    }
  }
});

function getPlaylistForTemplate(){
  const instance = Template.instance();
  const playlistId = instance.getPlaylistId();

  var nonNumeric = isNaN(playlistId);

  if(nonNumeric){
    var id = ReactiveMethod.call('getPlaylistIdByPrivateId', playlistId);
    return HostedPlaylists.findOne(id);
  }

  var intPlaylistId = parseInt(playlistId, 10);
  var publicPlaylist = HostedPlaylists.findOne({publicId: intPlaylistId});

  if(publicPlaylist){
    if(publicPlaylist.isPrivate){
      return null;
    }
    else{
      return publicPlaylist;
    }
  }

  // we check for the privateIds first since they are very likely non-numeric, but still have to check
  // here at the end in the case where a privateId happened to be purely numeric by chance
  return HostedPlaylists.getPlaylistByPrivateId(playlistId);
}