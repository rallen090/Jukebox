import { Meteor } from 'meteor/meteor';

import { Songs } from '../songs.js';

Meteor.publish('songs', function () {
  return Songs.find();
});