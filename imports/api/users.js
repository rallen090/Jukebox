import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { HostedPlaylists } from './hosted-playlists.js';

class UsersCollection extends Mongo.Collection {
  createNewUser(callback) {

    var id = super.insert({}, callback);
    window.alert(id);
    return id;
  }
}

export const Users = new UsersCollection('jukeboxUsers');

// allow inserts (note: best practice is to DENY crud operations and expose them via methods.js, but we can do that later if  we want to)
Users.allow({
  'insert': function () {
    return true; 
  },
});

Users.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  spotifyUserId: { type: String, optional: true },
  spotifyAuthToken: { type: String, optional: true },
});

Users.attachSchema(Users.schema);

// This represents the keys from Lists objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Users.publicFields = {
  spotifyUserId: 1,
  spotifyAuthToken: 1
};

Users.helpers({
  updateSpotifyUserId(id) {
    this.spotifyUserId = id;
    return;
  },
  updateSpotifyAuthToken(token) {
    this.spotifyAuthToken = token;
    return;
  },
});