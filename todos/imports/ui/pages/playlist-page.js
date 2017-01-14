import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from '../../api/playlists/hosted-playlists.js';

import './playlist-page.html';
import './app-not-found.js';

import { displayError } from '../lib/errors.js';  

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
  }
});

Template.playlist_page.events({
});
