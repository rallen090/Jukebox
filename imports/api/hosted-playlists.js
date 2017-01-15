import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import { Songs } from './songs.js';

class HostedPlaylistCollection extends Mongo.Collection {
  insert(list, callback) {
    const ourList = list;
    ourList.dateCreated = ourList.dateCreated || new Date();
    ourList.previousSongIds = [];
    // increment public id that is used in URLs
    var largestId = 0;
    try {
       largestId = this.findOne({}, {sort: {'publicId': -1}}).publicId;
    }
    catch (e) {
    }
    ourList.publicId = largestId ? largestId + 1 : 1;
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
  currentSongId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
  previousSongIds: { type: Array, optional: true }
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
  playNextSong() {
    // to play the next song, we look at this playlist's songs and grab unplayed sorted by votes then by date
    var nextSong = Songs.findOne({ hostedPlaylistId: this._id, played: false }, {sort: { voteCount: -1, dateAdded: -1 }});

    // return null if we have no more songs
    if(!nextSong){
      return {message: "No songs to play"};
    }

    // store previous songs in order
    if(!this.previousSongs){
      this.previousSongs = [];
    }
    this.previousSongs.push(nextSong._id);

    // flag the song as played and set the current song pointer
    this.currentSongId = nextSong._id;
    nextSong.setPlayed();

    // and return the actual spotify id to the streaming service
    return nextSong.spotifyId;
  },
  songs() {
    return Songs.find({ hostedPlaylistId: this._id }, { sort: { votes: -1 } });
  },
  initializeSongs(songs) {
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
