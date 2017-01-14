import { Meteor } from 'meteor/meteor';

import { HostedPlaylists } from '../hosted.js';
import { HostedPlaylists } from '../hosted-playlists.js';
import { HostedPlaylists } from '../hosted-playlists.js';

Meteor.publish('users', function () {
  return Users.find();
});
Meteor.publish('playlists', function () {
  return HostedPlaylists.find();
});
Meteor.publish('songs', function () {
  return Songs.find();
});

Meteor.startup(() => {
  // code to run on server at startup
});
