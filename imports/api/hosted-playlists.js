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

    ourList.hostToken = newGuid();
    ourList.privateId = newGuid();

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
  privateId: { type: String },
  privateAccess: { type: Boolean },
  privateControl: { type: Boolean },
  password: { type: String, optional: true },
  hostToken: { type: String },
  userId: { type: String, regEx: SimpleSchema.RegEx.Id},
  dateCreated: { type: Date },
  name: { type: String },
  currentSongId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
  previousSongIds: { type: Array, optional: true },
  'previousSongIds.$': {
    type: String
  },
  longitude: { type: Number, optional: true },
  latitude: { type: Number, optional: true },
});

HostedPlaylists.attachSchema(HostedPlaylists.schema);

// This represents the keys from Lists objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
HostedPlaylists.publicFields = {
  publicId: 1,
  privateAccess: 1,
  privateControl: 1,
  userId: 1,
  dateCreated: 1,
  name: 1,
  currentSongId: 1,
  previousSongIds: 1,
  longitude: 1,
  latitude: 1
};

HostedPlaylists.helpers({
  playNextSong() {
    // to play the next song, we look at this playlist's songs and grab unplayed sorted by votes then by date
    var nextSong = Songs.findOne({ hostedPlaylistId: this._id, played: false }, {sort: { voteCount: -1, dateAdded: 1 }});

    // return null if we have no more songs
    if(!nextSong){
      HostedPlaylists.update(this._id, {
        $set: { currentSongId: null},
      });

      return null;
    }

    // store previous songs in order
    if(!this.previousSongIds){
      this.previousSongIds = [];
    }
    this.previousSongIds.push(nextSong._id);

    // flag the song as played and set the current song pointer
    this.currentSongId = nextSong._id;
    nextSong.setPlayed();

    HostedPlaylists.update(this._id, {
      $push: { previousSongIds: nextSong._id},
    });

    HostedPlaylists.update(this._id, {
      $set: { currentSongId: this.currentSongId },
    });

    Songs.update(nextSong._id, {
      $set: { played: true },
    });

    // and return the actual spotify id to the streaming service
    return nextSong.spotifyId;
  },
  songs() {
    return Songs.find({ hostedPlaylistId: this._id, played: false }, { sort: { voteCount: -1, dateAdded: 1 } });
  },
  previousSongs() {
    // NOTE: we filter out the CURRENT song from this previous song list, despite it being marked as 'played' since that is treated as NOW-PLAYING
    return Songs.find({ hostedPlaylistId: this._id, played: true, _id: { $ne: this.currentSongId } }, { sort: { voteCount: -1 } });
  },
  initializeSongs(songs) {
    var playlistId = this._id;
    $.each(songs, function( index, value ) {
      Songs.insert({
        spotifyId: value.spotifyId,
        name: value.name,
        artist: value.artist,
        hostedPlaylistId: playlistId,
        imageUrl: value.imageUrl
      });
    });
    return;
  },
  getPrivateShareLink(userAuthToken) {
    var playlistId = this._id;
    $.each(songs, function( index, value ) {
      Songs.insert({
        spotifyId: value.spotifyId,
        name: value.name,
        artist: value.artist,
        hostedPlaylistId: playlistId,
        imageUrl: value.imageUrl
      });
    });
    return;
  },
  getHostLink(userAuthToken) {
    var playlistId = this._id;
    $.each(songs, function( index, value ) {
      Songs.insert({
        spotifyId: value.spotifyId,
        name: value.name,
        artist: value.artist,
        hostedPlaylistId: playlistId,
        imageUrl: value.imageUrl
      });
    });
    return;
  }
});

function newGuid() {
  // ref: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};