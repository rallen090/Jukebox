import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Users } from './api/users.js';
import { HostedPlaylists } from './api/hosted-playlists.js';
import { Songs } from './api/songs.js';
 
import './debug.html';

Template.debug_page.onCreated(function bodyOnCreated() {
});

Template.debug_page.helpers({
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