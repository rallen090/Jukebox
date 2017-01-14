import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Songs } from '../songs/songs.js';

class HostedPlaylistCollection extends Mongo.Collection {
  insert(list, callback) {
    const ourList = list;
    ourList.dateCreated = ourList.dateCreated || new Date();
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

// Deny all client-side updates since we will be using methods to manage this collection
HostedPlaylists.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

HostedPlaylists.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  userId: { type: String, regEx: SimpleSchema.RegEx.Id},
  dateCreated: { type: Date, denyUpdate: true },
  name: { type: String },
  currentSong: { type: String, regEx: SimpleSchema.RegEx.Id, optional: true },
});

HostedPlaylists.attachSchema(HostedPlaylists.schema);

// This represents the keys from Lists objects that should be published
// to the client. If we add secret properties to List objects, don't list
// them here to keep them private to the server.
HostedPlaylists.publicFields = {
  name: 1,
  currentSong: 1
};

HostedPlaylists.helpers({
  playNextSong(userId) {
    // TODO
    return this.currentSong;
  },
  songs() {
    //return Todos.find({ listId: this._id }, { sort: { createdAt: -1 } });
    return null;
  },
});
