import { Meteor } from 'meteor/meteor';

import { Users } from '../imports/api/users.js';
import { HostedPlaylists } from '../imports/api/hosted-playlists.js';
import { Songs } from '../imports/api/songs.js';

import '../imports/public-api/playlist-api.js';

import crypto from 'crypto';
import base64url from 'base64url';

// publishing of the db collections from the server
// note: here is where we can filter what is sent to the server (e.g. hiding certain fields)
Meteor.publish('jukeboxUsers', function () { // ONLY FOR DEBUGGING - should remove
  return Users.find({}, { fields: { spotifyAuthToken: 0 } });
});
Meteor.publish('publicPlaylists', function () {
  return HostedPlaylists.find({privateAccess: false}, { fields: { privateId: 0, hostToken: 0 } });
});
Meteor.publish('currentPlaylist', function (playlistId) {
  var nonNumeric = isNaN(playlistId);

  if(nonNumeric){
    return HostedPlaylists.find({privateId: playlistId}, { fields: { hostToken: 0 } });
  }

  var intPlaylistId = parseInt(playlistId, 10);
  var publicPlaylist = HostedPlaylists.findOne({publicId: intPlaylistId});

  if(publicPlaylist){
    if(publicPlaylist.privateAccess){
      return null;
    }
    else{
      return HostedPlaylists.find({publicId: intPlaylistId}, { fields: { privateId: 0, hostToken: 0 } });
    }
  }

  // we check for the privateIds first since they are very likely non-numeric, but still have to check
  // here at the end in the case where a privateId happened to be purely numeric by chance
  return HostedPlaylists.find({privateId: playlistId}, { fields: { hostToken: 0 } });
});
Meteor.publish('songs', function (playlistId) {
	var nonNumeric = isNaN(playlistId);
	var baseId = null;
	if(!nonNumeric){
		var id = parseInt(playlistId, 10);
		var playlist = HostedPlaylists.findOne({publicId: id});
		if(playlist){
			baseId = playlist._id;
		}
	}
	else{
		var playlist = HostedPlaylists.findOne({privateId: playlistId});
		if(playlist){
			baseId = playlist._id;
		}
	}

	if(!baseId){
		return null;
	}
	
  	return Songs.find({hostedPlaylistId: baseId}, { sort: { voteCount: -1, dateAdded: 1 } });
});

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
	// exposing private fields via server calls with an auth token
	createPlaylist(list, songs) {
		const ourList = list;
		ourList.dateCreated = ourList.dateCreated || new Date();
		ourList.previousSongIds = [];
		// increment public id that is used in URLs
		var largestId = 1;

		var highestPlaylist = HostedPlaylists.findOne({}, {sort: {'publicId': -1}});
		if(highestPlaylist){
			largestId = highestPlaylist.publicId + 1;
		}
		ourList.publicId = largestId;

		if (!ourList.name) {
		  const defaultName = "Default Playlist";
		  let nextLetter = 'A';
		  ourList.name = `${defaultName} ${nextLetter}`;

		  while (HostedPlaylists.findOne({ name: ourList.name })) {
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
		ourList.currentSongId = null;
		ourList.lastHostCheckIn = null;
		ourList.isPaused = false;

		var id = HostedPlaylists.insert(ourList);
		var playlist = HostedPlaylists.findOne(id);
		console.log(songs);
		playlist.initializeSongs(songs);

		// return the privateId of the new list
		return ourList.privateId;
	},
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
  	},
	updateSettings (playlistId, authToken, settings) {
		var user = Users.findOne({spotifyAuthToken: authToken});
		var playlist = HostedPlaylists.findOne(playlistId);
		if(user && playlist && user._id === playlist.userId){
		  HostedPlaylists.update(playlistId, {$set: settings});
		  return playlist.privateId;
		}
		return null;
	},
	pauseSong(playlistId, authToken){
		var updateFunc = () => HostedPlaylists.update(playlistId, {$set: {isPaused: true}});
		return controlPlaylist(playlistId, authToken, updateFunc);
	},
	unpauseSong(playlistId, authToken){
		var updateFunc = () => HostedPlaylists.update(playlistId, {$set: {isPaused: false}});
		return controlPlaylist(playlistId, authToken, updateFunc);
	},
	playNextSong(playlistId, authToken){
		var updateFunc = () => {
			var playlist = HostedPlaylists.findOne(playlistId);
			if(playlist){
				playlist.playNextSong(/* fromHost */ false);
				return true;
			}
			return false;
		};
		return controlPlaylist(playlistId, authToken, updateFunc);
	},
	playPreviousSong(playlistId, authToken){
		var updateFunc = () => {
			var playlist = HostedPlaylists.findOne(playlistId);
			if(playlist){
				playlist.playPreviousSong(/* fromHost */ false);
				return true;
			}
			return false;
		};
		return controlPlaylist(playlistId, authToken, updateFunc);
	},
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

function controlPlaylist(playlistId, authToken, updateFunction){
	var playlist = HostedPlaylists.findOne(playlistId);

	if(playlist){
		if(playlist.privateControl === true){
			updateFunction();
			return true;
		}
		else{
			var user = Users.findOne({spotifyAuthToken: authToken});
			if(user && user._id === playlist.userId){
			  updateFunction();
			  return true;
			}
		}
	}
	return false;
};