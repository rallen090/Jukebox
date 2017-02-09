import { Meteor } from 'meteor/meteor';

import { Users } from '../imports/api/users.js';
import { HostedPlaylists } from '../imports/api/hosted-playlists.js';
import { Songs } from '../imports/api/songs.js';

import '../imports/public-api/playlist-api.js';

// publishing of the db collections from the server
// note: here is where we can filter what is sent to the server (e.g. hiding certain fields)
Meteor.publish('jukeboxUsers', function () {
  return Users.find();
});
Meteor.publish('playlists', function () {
  return HostedPlaylists.find({}, { fields: { privateId: 0, hostToken: 0 } });
});
Meteor.publish('songs', function () {
  return Songs.find();
});

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
  getHostToken: function (playlistId, authToken) {
    var user = Users.findOne({spotifyAuthToken: authToken});
    var playlist = HostedPlaylists.findOne(playlistId);
    if(user && playlist && user._id === playlist.userId){
      return playlist.hostToken;
    }
    return null;
  },
  getPrivateId: function (playlistId, authToken) {
    var user = Users.findOne({spotifyAuthToken: authToken});
    var playlist = HostedPlaylists.findOne(playlistId);
    if(user && playlist && user._id === playlist.userId){
      return playlist.privateId;
    }
    return null;
  },
  getPlaylistIdByPrivateId(privateId){
  	console.log(privateId);
    var playlist = HostedPlaylists.findOne({privateId: privateId});
    console.log(playlist);
    if(playlist)
    {
    	return playlist._id;
    }
    return null;
  }
});