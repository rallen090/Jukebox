import { Meteor } from 'meteor/meteor';

import { Users } from '../imports/api/users.js';
import { HostedPlaylists } from '../imports/api/hosted-playlists.js';
import { Songs } from '../imports/api/songs.js';

import '../imports/public-api/playlist-api.js';

// publishing of the db collections from the server
// note: here is where we can filter what is sent to the server (e.g. hiding certain fields)
Meteor.publish('jukeboxUsers', function () { // ONLY FOR DEBUGGING - should remove
  return Users.find({}, { fields: { spotifyAuthToken: 0 } });
});
Meteor.publish('playlists', function () {
  return HostedPlaylists.find({}, { fields: { privateId: 0, hostToken: 0 } });
});
Meteor.publish('currentPlaylist', function (playlistId) {
  var nonNumeric = isNaN(playlistId);

  if(nonNumeric){
    return HostedPlaylists.find({privateId: playlistId}, { fields: { hostToken: 0 } });
  }

  var intPlaylistId = parseInt(playlistId, 10);
  var publicPlaylist = HostedPlaylists.find({publicId: intPlaylistId}, { fields: { privateId: 0, hostToken: 0 } });

  if(publicPlaylist){
    if(publicPlaylist.isPrivate){
      return null;
    }
    else{
      return publicPlaylist;
    }
  }

  // we check for the privateIds first since they are very likely non-numeric, but still have to check
  // here at the end in the case where a privateId happened to be purely numeric by chance
  return HostedPlaylists.find({privateId: playlistId}, { fields: { hostToken: 0 } });
});
Meteor.publish('songs', function () {
  return Songs.find();
});

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
	// exposing private fields via server calls with an auth token
	getHostInfo: function (playlistId, authToken) {
		var user = Users.findOne({spotifyAuthToken: authToken});
		var playlist = HostedPlaylists.findOne(playlistId);
		if(user && playlist && user._id === playlist.userId){
		  return {hostToken: playlist.hostToken, privateId: playlist.privateId};
		}
		return null;
	},
	updateUserWithAuthToken(userId, token) {
		if(token){
			var userWithTokenAlready = Users.findOne({spotifyAuthToken: token});
			if(userWithTokenAlready){
		      var id = userWithTokenAlready._id;
		      Users.update(id, {$set: { spotifyAuthToken: token }});
		      return id;
		    }
		}

		if(userId){
			var id = Users.findOne({_id: userId});
			if(id){
				Users.update(userId, {$set: { spotifyAuthToken: token }});
				return userId;
			}
		}

		var id = Users.insert({});
		Users.update(id, {$set: { spotifyAuthToken: token }});
		return id;
  }
});