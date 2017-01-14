import { Meteor } from 'meteor/meteor';

import { Users } from '../imports/api/users.js';
import { HostedPlaylists } from '../imports/api/hosted-playlists.js';
import { Songs } from '../imports/api/songs.js';

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
