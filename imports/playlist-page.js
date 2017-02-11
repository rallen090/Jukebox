import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from './api/hosted-playlists.js';
import { Songs } from './api/songs.js';
import { Users } from './api/users.js';

import './playlist-page.html';

var currentPlaylistId = null;

Template.playlist_page.onCreated(function playPageOnCreated() {
  this.getPlaylistId = () => FlowRouter.getParam('_id');
  currentPlaylistId = this.getPlaylistId();

  this.subscribe('currentPlaylist', this.getPlaylistId());
});

Template.playlist_page.onRendered(function playlistPageOnRendered(){
  // set up animations (in timeout to allow for load time)
  var self = this;
  setTimeout(function(){
    if(!self.find('.playlistContainer ul')){
      return;
    }

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
    return isOwnerInternal()
  },
  isControllable() {
    var playlist = HostedPlaylists.findOne();
    return playlist && (!playlist.privateControl || isOwnerInternal());
  },
  isPlaying(){
    return isPlayingInternal();
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
        return "sms:?body=" + shareMessage;
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "sms:&body=" + shareMessage;
    }

    return "mailto:?body=" + shareMessage + "&subject=JukeboxInvite";
  },
  getHostLink() {
    return getHostLinkInternal();
  },
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
  },
  'click #settings-action'(event){
    window.location.href = window.location.protocol + "//" + window.location.host + "/p/" + currentPlaylistId + "/settings";
  },
  'click #playSong'(event){
    if(isOwnerInternal()){
      getHostLinkInternal(function(link){
        handleLink(link);
      });
      return;
    }
    else{
      var playlist = HostedPlaylists.findOne();
      if(playlist.isPaused && isHostActive(playlist.lastHostCheckIn)){
        Meteor.call('unpauseSong', playlist._id, /* token */ null, function(error, result){
          alert("done");
        });
      }
      else{
        alert("The owner must first host the playlist using the app to begin! A link to host on the app yourself can also be sent to you by the owner.");
      }
    }
  },
  'click #pauseSong'(event){
      var playlist = HostedPlaylists.findOne();
      if(playlist.isPaused && isHostActive(playlist.lastHostCheckIn)){
        Meteor.call('pauseSong', playlist._id, /* token */ null, function(error, result){
          alert("done");
        });
      }
      else{
        if(isOwnerInternal()){
          getHostLinkInternal(function(link){
            handleLink(link);
          });
          return;
        }
        else{
          alert("The owner must first host the playlist using the app to begin! A link to host on the app yourself can also be sent to you by the owner.");
        }
      }
  },
  'click #playNextSong'(event){
      var playlist = HostedPlaylists.findOne();
      if(isHostActive(playlist.lastHostCheckIn)){
        Meteor.call('playNextSong', playlist._id, /* token */ null, function(error, result){
          alert("done");
        });
      }
      else{
        if(isOwnerInternal()){
          getHostLinkInternal(function(link){
            handleLink(link);
          });
          return;
        }
        else{
          alert("The owner must first host the playlist using the app to begin! A link to host on the app yourself can also be sent to you by the owner.");
        }
      }
  },
  'click #playPreviousSong'(event){
      var playlist = HostedPlaylists.findOne();
      if(isHostActive(playlist.lastHostCheckIn)){
        Meteor.call('playPreviousSong', playlist._id, /* token */ null, function(error, result){
          alert("done");
        });
      }
      else{
        if(isOwnerInternal()){
          getHostLinkInternal(function(link){
            handleLink(link);
          });
          return;
        }
        else{
          alert("The owner must first host the playlist using the app to begin! A link to host on the app yourself can also be sent to you by the owner.");
        }
      }
  },
});

// has to make async and sync since sync does not work in event handlers
function getHostInfoInternal(asyncCallback){
  var playlist = HostedPlaylists.findOne();

  if(!playlist){
    return null;
  }

  var playlistId = playlist._id;
  var authToken = Session.get("jukebox-spotify-access-token");

  if(asyncCallback){
    Meteor.call('getHostInfo', playlistId, authToken, function(error, result){
      asyncCallback(result);
    });
  }
  else
  {
    var hostToken = ReactiveMethod.call('getHostInfo', playlistId, authToken);
    return hostToken;
  }
};

function isOwnerInternal(){
  var playlist = HostedPlaylists.findOne();

  // fall out if this playlist does not exist
  if(!playlist){
    return false;
  }

  var playlistUserId = playlist.userId;
  return playlistUserId === Session.get("jukebox-active-user-id");
};

// has to make async and sync since sync does not work in event handlers
function getHostLinkInternal(asyncCallback){
    function getLink(result){
        var info = result;
        if(info && info.privateId && info.hostToken){
          var userAgent = navigator.userAgent || navigator.vendor || window.opera;
          var link = (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)
            ? "fb://host?hostToken=" + info.hostToken + "&playlistId=" + info.privateId
            : null;
          if(asyncCallback){
            asyncCallback(link);
          }
          return link;
        };
    };

    if(asyncCallback){
      getHostInfoInternal(getLink);
      return;
    }

    return getLink(getHostInfoInternal());
};

function handleLink(link){
  console.log(link);
  // TODO: replace w/ our own jukebox URL (it tries deep one first, then we can go to app store if not exist)
  if(link){
    window.open("http://appurl.io/iz1qh8m6");
  }else{
    $('.ui.basic.modal')
      .modal({
        onApprove : function() {
          window.open("https://itunes.apple.com/us/app/facebook/id284882215?mt=8");
        },
        onDeny : function() {
          // noop
          }})
      .modal('show');
  }
};

function isPlayingInternal(){
  var playlist = HostedPlaylists.findOne();
  return playlist && (!playlist.isPaused && playlist.currentSongId && isHostActive(playlist.lastHostCheckIn));
};

function isHostActive(lastHostCheckIn){
  return ((new Date() - lastHostCheckIn) / 1000 < 10);
};

function refreshTimeout(){

};