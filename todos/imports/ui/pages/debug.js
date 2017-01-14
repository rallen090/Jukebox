import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Lists } from '../../api/lists/lists.js';
import { Users } from '../../api/users/users.js';
import { HostedPlaylists } from '../../api/playlists/hosted-playlists.js';
import { Songs } from '../../api/songs/songs.js';
 
import './debug.html';

Template.debug_page.onCreated(function bodyOnCreated() {
});

Template.debug_page.helpers({
  lists() {
    return Lists.find();
  },
  users() {
    return Users.find();
  },
  hostedPlaylists() {
    return HostedPlaylists.find();
  },
  songs() {
    return Songs.find();
  },
});