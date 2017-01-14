import { Meteor } from 'meteor/meteor';

import { HostedPlaylists } from '../hosted-playlists.js';

Meteor.publish('playlists', function () {
  return HostedPlaylists.find();
});