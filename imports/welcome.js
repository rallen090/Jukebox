import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from './api/hosted-playlists.js';

import './welcome.html';

Template.welcome_page.onCreated(function playPageOnCreated() {

});

Template.welcome_page.helpers({

});

Template.welcome_page.events({
  'click #js-party-joiner'() {
  	var playlistId = $('#playlist-id').val();
  	alert(playlistId);
      var playlist = HostedPlaylists.findOne({publicId: playlistId});
  	alert(playlist);

      if(!playlist){
        $('#invalidPlaylistAlert').display;;
      } else {
	  	FlowRouter.go('Jukebox.playlist', { _id: playlistId });
      }
  },

});
