import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from './api/hosted-playlists.js';
import { Songs } from './api/songs.js';
import { Users } from './api/users.js';

import './services/spotify.js';

import './playlist-page.html';

// save off query parameters
var currentPlaylistId = null;
var currentHostToken = null;

// save off host info locally so we don't need to request more than once for it (NOTE: important to reset OnCreated, because it won't be reset automatically)
var savedHostInfo = null;

Template.playlist_page.onCreated(function playPageOnCreated() {
  // reset cached hostInfo
  savedHostInfo = null;

  var self = this;
  self.getPlaylistId = () => FlowRouter.getParam('_id');
  self.getHostToken = () => FlowRouter.getQueryParam("hostToken");
  currentPlaylistId = self.getPlaylistId();
  currentHostToken = self.getHostToken();

  checkPassword(this, /* retry */ false);

  // set up reactive checking up if the playlist is active using a timer
  self.isPlaying = new ReactiveVar(false);
  var isPlayingHandler = () => {
    var playlist = HostedPlaylists.findOne();

    if(!playlist){ return false; }

    var isActive = isHostActive(playlist.lastHostCheckIn);
    var playing = playlist && (!playlist.isPaused && playlist.currentSongId !== null && isActive);
    self.isPlaying.set(playing);

    // we re-display the controls here since this is what causes potential lag between actions
    showMusicControls();

    return true;
  };

  self.handle = Meteor.setInterval((function() {
    isPlayingHandler();
  /* setting this pretty low since it makes for smoother reactivity*/
  }), 500);

  // call once immediately
  setTimeout(isPlayingHandler, 500);

  setTimeout(function(){
    var playlist = HostedPlaylists.findOne();
    if(!playlist){
      $('#page-loader').remove();
      $('#no-playlist-block').show();
    }
  }, 2000);
});

function checkPassword(self, retry){
    var passwordKey = "jukebox-" + currentPlaylistId + "-password";
    var passwordAttempt = Session.get(passwordKey);
    
    Meteor.call("checkPassword", currentPlaylistId, passwordAttempt, function(error, result){
      if(result){
        if(result.requiresPassword === true){
            if(!passwordAttempt || result.incorrectPassword === true){
              if(retry){
                $("#passwordHeader").html("Wrong password - try again:");
              }

              $("#password-input").select();

              $('.password-modal')
                .modal({
                  onApprove : function() {
                    var password = $("#password-input").val();
                    Session.setPersistent(passwordKey, password);
                    
                    checkPassword(self, /* retry */ true);
                  }})
                .modal('show');
            }
            else{
              self.subscribe('currentPlaylist', currentPlaylistId, passwordAttempt);
              self.subscribe('songs', currentPlaylistId);
            }
        }
        else{
          self.subscribe('currentPlaylist', currentPlaylistId, /* password */ null);
          self.subscribe('songs', currentPlaylistId);
        }
      }
    });
};

Template.playlist_page.onRendered(function playlistPageOnRendered(){
  // set up animations (in timeout to allow for load time)
  var self = this;
  setTimeout(function(){
    if(!self.find('.playlistContainer ul')){
      return;
    }

    self.find('.playlistContainer ul')._uihooks = {
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

    // add popups to tutorialize
    $(".playlistShare").popup({position : 'right center', on: 'hover'}).popup("show");
    setTimeout(() => $(".playlistShare").popup("hide"), 3000);
  }, 1000);

  // execute post-action after spotify auth
  tryExecuteQueuedAction({savePlaylist: () => {
    $("#save-action").prop('disabled', true);
    $("#save-action").css('color', 'white');
  }});

  // check password
  $("#password-input").on('keyup', function (e) {
    if(e && e.keyCode === 13){
      $("#password-button").click();
    }
  });

  // try redirect to app
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    window.location = "jukebox://join/?playlistId=" + currentPlaylistId;
  }
  else if (/android/i.test(userAgent)) {
    window.location = "jukeboxapp://join/?playlistId=" + currentPlaylistId;
  }
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
    var isValidHostToken = currentHostToken ? ReactiveMethod.call('isValidHostToken', playlist._id, currentHostToken) : false;

    // allow control if:
    // (1) control is public
    // (2) you are the owner
    // or (3) you have the hostToken, which allows people to share hosting ability
    return playlist && (!playlist.privateControl || isOwnerInternal() || isValidHostToken);
  },
  isPlaying(){
    return Template.instance().isPlaying.get();
  },
  isPlayingOrPaused(){
    var playlist = HostedPlaylists.findOne();
    return playlist && (Template.instance().isPlaying.get() || playlist.isPaused);
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
    var shareMessage = "Join the Jukebox: "  + window.location.host + "/p/" + playlistId;

    // android
    if (/android/i.test(userAgent)) {
        return "sms:1?body=" + shareMessage;
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "sms:&body=" + shareMessage;
    }

    return "mailto:?body=" + shareMessage + "&subject=JukeboxInvite";
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
  'click #share-host-link'(event){
    getHostLinkInternal(link => {
      var userAgent = navigator.userAgent || navigator.vendor || window.opera;
      var shareMessage = "Host the Jukebox: "  + encodeURIComponent(link);

      // android
      if (/android/i.test(userAgent)) {
          location.href = "sms:?body=" + shareMessage;
          return;
      }

      // iOS detection from: http://stackoverflow.com/a/9039885/177710
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
          location.href = "sms:1&body=" + shareMessage;
          return;
      }

      location.href = "mailto:?body=" + shareMessage + "&subject=JukeboxInvite";
      return;
    });
  },
  'click #playSong'(event){
    hideMusicControls();
    
    var playlist = HostedPlaylists.findOne();
    if(playlist.isPaused && isHostActive(playlist.lastHostCheckIn)){
      getHostToken(function(hostToken) {
        Meteor.call('unpauseSong', playlist._id, hostToken, function(error, result){
          // TODO: handle this?
        });
      });
    }
    else{
      if(isControllableInternal()){
        getHostLinkInternal(function(link){
          handleLink(link);
        });
      }
      else{
        window.alert("The owner must first host the playlist using the app to begin! A link to host on the app yourself can also be sent to you by the owner.");
      }
    }
  },
  'click #pauseSong'(event){
      hideMusicControls();

      var playlist = HostedPlaylists.findOne();
      if(!playlist.isPaused && isHostActive(playlist.lastHostCheckIn)){
        getHostToken(function(hostToken) {
          Meteor.call('pauseSong', playlist._id, hostToken, function(error, result){
            // TODO: handle this?
          });
        });
      }
      else{
        if(isControllableInternal()){
          getHostLinkInternal(function(link){
            handleLink(link);
          });
        }
        else{
          alert("The owner must first host the playlist using the app to begin! A link to host on the app yourself can also be sent to you by the owner.");
        }
      }
  },
  'click #playNextSong'(event){
      hideMusicControls();

      var playlist = HostedPlaylists.findOne();
      if(isHostActive(playlist.lastHostCheckIn)){
        getHostToken(function(hostToken) {
          Meteor.call('playNextSong', playlist._id, hostToken, function(error, result){
            // TODO: handle this?
          });
        });
      }
      else{
        if(isControllableInternal()){
          getHostLinkInternal(function(link){
            handleLink(link);
          });
        }
        else{
          alert("The owner must first host the playlist using the app to begin! A link to host on the app yourself can also be sent to you by the owner.");
        }
      }
  },
  'click #playPreviousSong'(event){
      hideMusicControls();

      var playlist = HostedPlaylists.findOne();
      if(isHostActive(playlist.lastHostCheckIn)){
        getHostToken(function(hostToken) {
          Meteor.call('playPreviousSong', playlist._id, hostToken, function(error, result){
            // TODO: handle this?
          });
        });
      }
      else{
        if(isControllableInternal()){
          getHostLinkInternal(function(link){
            handleLink(link);
          });
        }
        else{
          alert("The owner must first host the playlist using the app to begin! A link to host on the app yourself can also be sent to you by the owner.");
        }
      }
  },
});

// has to make async and sync since sync does not work in event handlers
function getHostInfoInternal(asyncCallback){
  if(savedHostInfo){
    if(asyncCallback){
      asyncCallback(savedHostInfo);
      return;
    }
    return savedHostInfo;
  }

  var playlist = HostedPlaylists.findOne();

  if(!playlist){
    return null;
  }

  var playlistId = playlist._id;
  var authToken = Session.get("jukebox-spotify-access-token");

  if(asyncCallback){
    Meteor.call('getHostInfo', playlistId, authToken, function(error, result){
      if(result){
        savedHostInfo = result;
      }
      asyncCallback(result);
    });
  }
  else
  {
    var info = ReactiveMethod.call('getHostInfo', playlistId, authToken);
    if(info){
      savedHostInfo = info;
    }
    return info;
  }
};

function getHostToken(asyncCallback){
  if(currentHostToken){
    asyncCallback(currentHostToken);
  }
  else{
    getHostInfoInternal((hostInfo) => {
      if(hostInfo && hostInfo.hostToken){
        asyncCallback(hostInfo.hostToken);
      }
      else{
        asyncCallback(null);
      }
    });
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

function isControllableInternal(){
  return (currentHostToken != null) || isOwnerInternal();
}

// has to make async and sync since sync does not work in event handlers
function getHostLinkInternal(asyncCallback){
    function getLink(result){
        var info = result;
        if(info && info.privateId && info.hostToken){
          var link = window.location.protocol + "//" + window.location.host + "/host/" + "?hostToken=" + info.hostToken + "&privateId=" + info.privateId;
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
  // if mobile go to host page to redirect to app
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if(((/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)) || /android/i.test(userAgent)){
    //window.open(link);
    window.location = link;
  }else{
    // otherwise show the app stores
    $('.confirm-modal')
      .modal({
        onApprove : function(element) {
          if(element.hasClass("android")){
            window.open("https://play.google.com/store/apps/details?id=com.facebook.katana");
          }else{
            window.open("https://itunes.apple.com/us/app/facebook/id284882215?mt=8");
          }
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
  if(!lastHostCheckIn){
    return false;
  }

  return ((new Date() - lastHostCheckIn) / 1000 < 10);
};

function getAuthToken(){
  return Session.get("jukebox-spotify-access-token");
};

function showMusicControls(){
  if(controlsHidden){
    $("#music-control-loader").removeClass("active");
    $(".musicIconLink").prop('disabled', false);
    $(".musicIconLink").removeClass("disabled");
    controlsHidden = false;
  }
};

var controlsHidden = false;
function hideMusicControls(){
  $("#music-control-loader").addClass("active");
  $(".musicIconLink").addClass("disabled");
  $(".musicIconLink").prop('disabled', true);
  controlsHidden = true;
};