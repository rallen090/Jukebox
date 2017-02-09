import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import { Users } from './users.js';
import { Songs } from './songs.js';

import crypto from 'crypto';
import base64url from 'base64url';

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
    ourList.hostToken = newUrlSafeGuid(5, token => HostedPlaylists.findOne({hostToken: token}));
    ourList.privateId = newUrlSafeGuid(5, id => HostedPlaylists.findOne({privateId: id}));

    // default access/control policies
    ourList.privateAccess = false;
    ourList.privateControl = true;
    ourList.password = null;

    // set state
    ourList.lastHostCheckIn = null;
    ourList.isPaused = false;

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
  }
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
  lastHostCheckIn: { type: Date, optional: true },
  isPaused: { type: Boolean },
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
  lastHostCheckIn: 1,
  isPaused: 1,
  name: 1,
  currentSongId: 1,
  previousSongIds: 1,
  longitude: 1,
  latitude: 1
};

HostedPlaylists.helpers({
  playNextSong() {
    // check in
    HostedPlaylists.update(this._id, {
      $set: { lastHostCheckIn: new Date() },
    });

    // handle pause
    if(this.isPaused){
      HostedPlaylists.update(this._id, {
        $set: { isPaused: false },
      });

      // the 'now playing' song is always the latest in the previous song queue, so we just return that again
      if(this.previousSongIds && this.previousSongIds.length >= 1){
        return this.previousSongIds[this.previousSongIds.length - 1];
      }
      // we should not end up in a case where the playlist was paused before a song began, but just in case,
      // we continue as normal which should still handle this case gracefully
    }

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
  checkStatus(){
    // check in
    HostedPlaylists.update(this._id, {
      $set: { lastHostCheckIn: new Date() },
    });
    var nextSong = Songs.findOne({ hostedPlaylistId: this._id, played: false }, {sort: { voteCount: -1, dateAdded: 1 }});
    var nextSongId = null;
    if(nextSong){
      nextSongId = nextSong.spotifyId;
    }
    var currentSongId = (this.previousSongIds && this.previousSongIds.length >= 1) ? this.previousSongIds[this.previousSongIds.length - 1] : null;

    return {
      currentSong: currentSongId,
      nextSong: nextSongId,
      isPaused: this.isPaused,
      lastHostCheckIn: this.lastHostCheckIn
    };
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
    var user = Users.findOne({spotifyAuthToken: userAuthToken});

    if(user._id === this.userId){
      return window.location.protocol + "//" + window.location.host + "/playlist/" + this.privateId;
    }

    return null;
  },
  getHostLink(userAuthToken) {
    var user = Users.findOne({spotifyAuthToken: userAuthToken});

    if(user._id === this.userId){
      return "jukeboxapp://host?hostToken=" + this.hostToken + "&playlistId=" + this.privateId;
    }

    return null;
  },
  isPlaying(){
    // check (a) that the current song has been set
    if(this.currentSongId 
      // (b) it is not paused
      && !this.isPaused 
      // and (c) we've had a check-in in the last 5 seconds (otherwise, assume we lost the player)
      && ((new Date() - this.lastHostCheckIn) / 1000 < 5)){
        return true;
    }
    return false;
  }
});

function newUrlSafeGuid(bytes, matcher) {
  // generate ids until we get a unique one (base64 should prevent collision problems)
  var id;
  do
  {
    id = base64url(crypto.randomBytes(bytes));
  }
  while(matcher(id));
  
  return id;
};