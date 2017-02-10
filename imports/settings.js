import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Users } from './api/users.js';
import { HostedPlaylists } from './api/hosted-playlists.js';
 
import './settings.html';

Template.settings_page.onCreated(function settingsOnCreated() {
    this.getPlaylistId = () => FlowRouter.getParam('_id');
    this.subscribe('currentPlaylist', this.getPlaylistId());
});

Template.settings_page.onRendered(function settingsOnRendered(){
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
  }
});

Template.settings_page.events({
    'click #save'(event) {
        // Meteor.call('updateSettings', playlistId, authToken, settings, function(error, result){

        // });
    },
});