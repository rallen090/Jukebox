import { Meteor } from 'meteor/meteor';

import { Users } from '../users.js';

Meteor.publish('users', function () {
  return Users.find();
});