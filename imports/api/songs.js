import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import { Playlists } from './hosted-playlists.js';

class SongsCollection extends Mongo.Collection {
  insert(song, callback) {
    const ourSong = song;
    ourSong.voteCount = 0;
    ourSong.votes = [];
    ourSong.played = false;
    ourSong.dateAdded = ourSong.dateAdded || new Date();
    const result = super.insert(ourSong, callback);
    return result;
  }
  update(selector, modifier) {
    const result = super.update(selector, modifier);
    return result;
  }
  remove(selector) {
    const songs = this.find(selector).fetch();
    const result = super.remove(selector);
    return result;
  }
}

export const Songs = new SongsCollection('songs');

// allow inserts (note: best practice is to DENY crud operations and expose them via methods.js, but we can do that later if  we want to)
Songs.allow({
  'insert': function () {
    return true; 
  },
});

Songs.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
  hostedPlaylistId: {
    type: String,
  },
  spotifyId: {
    type: String,
  },
  name: {
    type: String,
    max: 200,
    optional: true,
  },
  artist: {
    type: String,
    max: 200,
    optional: true,
  },
  dateAdded: {
    type: Date,
  },
  votes: {
    type: Array
  },
  'votes.$': {
    type: String
  },
  voteCount: {
    type: Number
  },
  played: {
    type: Boolean
  },
});

Songs.attachSchema(Songs.schema);

// This represents the keys from Lists objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
Songs.publicFields = {
  hostedPlaylistId: 1,
  spotifyId: 1,
  name: 1,
  artist: 1,
  dateAdded: 1,
  votes: 1,
  voteCount: 1,
  played: 1,
};

Songs.helpers({
  getPlaylist() {
    return Playlists.findOne(this.hostedPlaylistId);
  },
  vote(userId) {
    // perform these operations atomically on the db for thread safety (via $inc for count and $push/$pull for userId vote list)
    Songs.update(this._id, { $inc: { voteCount: 1 } });
    Songs.update(this._id, { $push: { votes: userId } });
  },
  unvote(userId) {
    Songs.update(this._id, { $inc: { voteCount: -1 } });
    Songs.update(this._id, { $pull: { votes: userId } });
  },
  setPlayed() {
    this.played = true;
  }
});
