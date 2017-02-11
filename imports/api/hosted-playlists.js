import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import { Users } from './users.js';
import { Songs } from './songs.js';

class HostedPlaylistCollection extends Mongo.Collection {
}

export const HostedPlaylists = new HostedPlaylistCollection('playlists');

// allow inserts (note: best practice is to DENY crud operations and expose them via methods.js, but we can do that later if  we want to)
HostedPlaylists.allow({
  'insert': function () {
    return false; 
  },
  'update': function () {
    return false; 
  },
  'remove': function () {
    return false; 
  }
});

HostedPlaylists.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  publicId: { type: Number, },
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

if(Meteor.isServer){
  HostedPlaylists._ensureIndex('publicId', {unique: 1});  
}

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
  playNextSong(fromHost) {
    // check in (only do this from the host app)
    if(fromHost === true){
      HostedPlaylists.update(this._id, {
        $set: { lastHostCheckIn: new Date() },
      });
    }

    // handle pause
    if(this.isPaused){
      HostedPlaylists.update(this._id, {
        $set: { isPaused: false },
      });

      // the 'now playing' song is always the latest in the previous song queue, so we just return that again
      // ALSO, we only handle this from the host - otherwise, we actually perform the skip
      if(fromHost === true && this.previousSongIds && this.previousSongIds.length >= 1){
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
  playPreviousSong(fromHost) {
    // check in (only do this from the host app)
    if(fromHost === true){
      HostedPlaylists.update(this._id, {
        $set: { lastHostCheckIn: new Date() },
      });
    }

    // handle pause
    if(this.isPaused){
      HostedPlaylists.update(this._id, {
        $set: { isPaused: false },
      });
    }

    // store previous songs in order
    var newCurrentSpotifyId;
    if(this.previousSongIds){
      // add current song back to queue
      var songIdToAddBack = this.previousSongIds.pop();
      HostedPlaylists.update(this._id, {
        $pop: { previousSongIds: songIdToAddBack},
      });
      Songs.update(songIdToAddBack, {
        $set: { played: false },
      });

      // set up previous song
      if(this.previousSongIds.length > 0){
        var previousSongId = this.previousSongIds[previousSongIds.length - 1];
        var previousSong = Songs.findOne(previousSongId);
        newCurrentSpotifyId = previousSong.spotifyId;

        Songs.update(previousSongId, {
          $set: { played: true },
        });
        HostedPlaylists.update(this._id, {
          $set: { currentSongId: previousSongId },
        });
      }
      else{
        // if no previous song, just set the current song to nothing
        HostedPlaylists.update(this._id, {
          $set: { currentSongId: null },
        });
        return null;
      }
    }

    // and return the actual spotify id to the streaming service
    return newCurrentSpotifyId;
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
    songs.forEach(function(value) {
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