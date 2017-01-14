import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Playlists } from '../playlists/hosted-playlists.js';

class SongsCollection extends Mongo.Collection {
  insert(song, callback) {
    const ourSong = song;
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

// Deny all client-side updates since we will be using methods to manage this collection
Songs.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Songs.schema = new SimpleSchema({
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
  },
  hostedPlaylistId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    denyUpdate: true,
  },
  spotifyId: {
    type: String,
    denyUpdate: true,
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
    denyUpdate: true,
  },
  votes: {
    type: [Number],
    defaultValue: [],
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
  addedOn: 1,
  votes: 1,
};

// check if an element exists in array using a comparer function
// comparer : function(currentElement)
Array.prototype.inArray = function(element) { 
    for(var i=0; i < this.length; i++) { 
        if(element === this[i]) return true; 
    }
    return false; 
}; 

// adds an element to the array if it does not already exist using a comparer 
// function
Array.prototype.pushIfNotExist = function(element) { 
    if (!this.inArray(element)) {
        this.push(element);
    }
}; 

Songs.helpers({
  getPlaylist() {
    return Playlists.findOne(this.hostedPlaylistId);
  },
  vote(userId) {
    this.upVotes.pushIfNotExist(userId);
  },
  unvote(userId) {
    if(index > -1){
      this.votes.splice(this.upVotes.indexof(userId), 1);
    }
  },
});
