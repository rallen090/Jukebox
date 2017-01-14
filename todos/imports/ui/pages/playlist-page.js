import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from '../../api/playlists/hosted-playlists.js';

import './playlist-page.html';
import './app-not-found.js';

import { displayError } from '../lib/errors.js';  

Template.playlist_page.onCreated(function playPageOnCreated() {
  this.getPlaylistId = () => FlowRouter.getParam('_id');
});

Template.playlist_page.helpers({
  playlist() {
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({publicId: playlistId});
    return playlist;
  },
  songs(){
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({publicId: playlistId});
    return playlist ? playlist.songs() : [];
  },
  isOwner(){
    const instance = Template.instance();
    const playlistId = instance.getPlaylistId();
    var playlist = HostedPlaylists.findOne({publicId: playlistId});
    alert(playlist);
    var playlistUserId = playlist.userId;
    return playlistUserId === Session.get("jukebox-active-user-id");
  }
});

Template.playlist_page.events({
  'click .js-cancel'(event, instance) {
    instance.state.set('editing', false);
  },

  'keydown input[type=text]'(event) {
    // ESC
    if (event.which === 27) {
      event.preventDefault();
      $(event.target).blur();
    }
  },

  'blur input[type=text]'(event, instance) {
    // if we are still editing (we haven't just clicked the cancel button)
    if (instance.state.get('editing')) {
      instance.saveList();
    }
  },

  'submit .js-edit-form'(event, instance) {
    event.preventDefault();
    instance.saveList();
  },

  // handle mousedown otherwise the blur handler above will swallow the click
  // on iOS, we still require the click event so handle both
  'mousedown .js-cancel, click .js-cancel'(event, instance) {
    event.preventDefault();
    instance.state.set('editing', false);
  },

  // This is for the mobile dropdown
  'change .list-edit'(event, instance) {
    const target = event.target;
    if ($(target).val() === 'edit') {
      instance.editList();
    } else if ($(target).val() === 'delete') {
      instance.deleteList();
    } else {
      instance.toggleListPrivacy();
    }

    target.selectedIndex = 0;
  },

  'click .js-edit-list'(event, instance) {
    instance.editList();
  },

  'click .js-toggle-list-privacy'(event, instance) {
    instance.toggleListPrivacy();
  },

  'click .js-delete-list'(event, instance) {
    instance.deleteList();
  },

  'click .js-todo-add'(event, instance) {
    instance.$('.js-todo-new input').focus();
  },

  'submit .js-todo-new'(event) {
    event.preventDefault();

    const $input = $(event.target).find('[type=text]');
    if (!$input.val()) {
      return;
    }

    insert.call({
      listId: this.list()._id,
      text: $input.val(),
    }, displayError);

    $input.val('');
  },
});
