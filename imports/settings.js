import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Users } from './api/users.js';
import { HostedPlaylists } from './api/hosted-playlists.js';

import './services/spotify.js';
 
import './settings.html';

var playlistId = null;

Template.settings_page.onCreated(function settingsOnCreated() {
    // verify that we are authenticated w/ spotify so that we have an access token to use for saving
    acquireSpotifyAccessToken(/* reacquire */false, /* queuedAction */ null);

    this.getPlaylistId = () => FlowRouter.getParam('_id');
    playlistId = this.getPlaylistId();

    var passwordKey = "jukebox-" + playlistId + "-password";
    var password = Session.get(passwordKey);
    this.subscribe('currentPlaylist', this.getPlaylistId(), password);
});

Template.settings_page.onRendered(function settingsOnRendered(){
  setTimeout(function(){
      $("#password-input").on('keyup', function (e) {
        if(e && e.keyCode === 13){
          $("#save").click();
        }
      });
    }, 500);
});

Template.settings_page.helpers({
  playlist() {
    return HostedPlaylists.findOne();
  },
  isOwner(){
      var playlist = HostedPlaylists.findOne();

      // fall out if this playlist does not exist
      if(!playlist){
        return false;
      }

      var playlistUserId = playlist.userId;
      return playlistUserId === Session.get("jukebox-active-user-id");
  },
  publicAccess(){
    var playlist = HostedPlaylists.findOne();
    return playlist && !playlist.privateAccess;
  },
  publicControl(){
    var playlist = HostedPlaylists.findOne();
    return playlist && !playlist.privateControl;
  }
});

Template.settings_page.events({
    'click #save'(event) {
        $('save-loading-icon').show();

        var authToken = acquireSpotifyAccessToken(/* reacquire */false, /* queuedAction */ null);
        var playlist = HostedPlaylists.findOne();

        if(!playlist){
          return;
        }

        var publicAccess = $('#private-access-checkbox').is(":checked");
        var publicControl = $('#private-control-checkbox').is(":checked");
        var password = $('#password-input').val();

        var settings = {
          privateAccess: !publicAccess,
          privateControl: !publicControl,
          password: password
        };

        Meteor.call('updateSettings', playlist._id, authToken, settings, function(error, result){
          // the return value is the privateId since we want to make sure we return w/ that in the case where access became private
          var privateId = result;
          if(privateId){
            $('#save-message').html("Playlist saved!");
            $('#save-message-button').addClass('green');
          }
          else{
            $('#save-message').html("Failed to save playlist");
            $('#save-message-button').addClass('red');
          }

          $('.ui.basic.modal')
            .modal({
              onApprove : function() {
                window.location.href = window.location.protocol + "//" + window.location.host + "/p/" + privateId;
              }})
            .modal('show');
        });
    },
    'click #cancel'(event) {
      window.location.href = window.location.protocol + "//" + window.location.host + "/p/" + playlistId;
    }
});