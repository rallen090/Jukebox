import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import { Songs } from './songs.js';

class HostedPlaylistCollection extends Mongo.Collection {
  insert(list, callback) {
    const ourList = list;
    ourList.dateCreated = ourList.dateCreated || new Date();

    // increment public id that is used in URLs
    var largestId = 0;
    try {
       largestId = this.findOne({}, {sort: {'publicId': -1}}).publicId;
    }
    catch (e) {
    }
    ourList.publicId = largestId ? largestId + 1 : 1;
    window.alert(largestId);
    if (!ourList.name) {
      const defaultName = "Default Playlist";
      let nextLetter = 'A';
      ourList.name = `${defaultName} ${nextLetter}`;

      while (this.findOne({ name: ourList.name })) {
        // not going to be too smart here, can go past Z
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
        ourList.name = `${defaultName} ${nextLetter}`;
      }
    }

    return super.insert(ourList, callback);
  }
  remove(selector, callback) {
    Songs.remove({ hostedPlaylistId: selector });
    return super.remove(selector, callback);
  }
}

export const HostedPlaylists = new HostedPlaylistCollection('playlists');

// allow inserts (note: best practice is to DENY crud operations and expose them via methods.js, but we can do that later if  we want to)
HostedPlaylists.allow({
  'insert': function () {
    return true; 
  },
});

HostedPlaylists.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  publicId: { type: Number },
  userId: { type: String, regEx: SimpleSchema.RegEx.Id},
  dateCreated: { type: Date },
  name: { type: String },
  currentSong: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
});

HostedPlaylists.attachSchema(HostedPlaylists.schema);

// This represents the keys from Lists objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
HostedPlaylists.publicFields = {
  publicId: 1,
  userId: 1,
  dateCreated: 1,
  name: 1,
  currentSong: 1
};

HostedPlaylists.helpers({
  playNextSong(userId) {
    // TODO
    return this.currentSong;
  },
  songs() {
    return Songs.find({ hostedPlaylistId: this._id }, { sort: { votes: -1 } });
  },
  initializeSongs(songs) {
    window.alert(this._id);
    var playlistId = this._id;
    $.each(songs, function( index, value ) {
      Songs.insert({
        spotifyId: value.spotifyId,
        name: value.name,
        artist: value.artist,
        hostedPlaylistId: playlistId,
      });
    });
    return;
  }
});
