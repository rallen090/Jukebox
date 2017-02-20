import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http'

import { Users } from '../imports/api/users.js';
import { HostedPlaylists } from '../imports/api/hosted-playlists.js';
import { Songs } from '../imports/api/songs.js';

import '../imports/public-api/playlist-api.js';

import crypto from 'crypto';
import base64url from 'base64url';

// publishing of the db collections from the server
// note: here is where we can filter what is sent to the server (e.g. hiding certain fields)
Meteor.publish('jukeboxUsers', function (userId, authToken) {
  return Users.find({_id: userId, spotifyAuthToken: authToken}, { fields: { spotifyAuthToken: 0 } });
});
Meteor.publish('currentUser', function (userId, authToken) {
	var currentUser = Users.findOne({_id: userId});

	if(!currentUser){
		return [];
	}

	if(currentUser.spotifyAuthToken && currentUser.spotifyAuthToken === authToken){
		return Users.find({_id: userId}, { fields: { spotifyAuthToken: 0 } });
	}

	if(authToken){
		var response = [];
		try
		{
			response = HTTP.get('https://api.spotify.com/v1/me', {headers: {
	           'Authorization': 'Bearer ' + authToken
	        }});
		}
		catch(ex)
		{
			console.log(ex);
			return [];
		}

		// if we have a valid spotify ID - then we are still authenticated
		if(response && response.data && response.data.id){
			if(currentcurrentUser.spotifyUserId === response.data.id){
				return Users.find({_id: userId}, { fields: { spotifyAuthToken: 0 } });
			}
		}		
	}

  	return [];
});
Meteor.publish('publicPlaylists', function () {
  return HostedPlaylists.find({privateAccess: false}, { fields: { privateId: 0, hostToken: 0, password: 0 } });
});
Meteor.publish('myPlaylists', function(userId, authToken){
	var currentUser = Users.findOne({_id: userId, spotifyAuthToken: authToken});
	if(currentUser){
		return HostedPlaylists.find({userId: userId}, { fields: { hostToken: 0, password: 0 } });
	}
	return [];
});
Meteor.publish('currentPlaylist', function (playlistId, password) {
  var nonNumeric = isNaN(playlistId);

  if(nonNumeric){
  	return getPrivatePlaylistsWithId(playlistId, password);
  }

  var intPlaylistId = parseInt(playlistId, 10);
  var publicPlaylist = HostedPlaylists.findOne({publicId: intPlaylistId});

  if(publicPlaylist){
    if(publicPlaylist.privateAccess){
      return [];
    }
    else{
    	// check password
    	if(publicPlaylist.password){
    		if(publicPlaylist.password === password){
    			return HostedPlaylists.find({publicId: intPlaylistId}, { fields: { privateId: 0, hostToken: 0 } });
    		}
    		return [];
    	}

      	return HostedPlaylists.find({publicId: intPlaylistId}, { fields: { privateId: 0, hostToken: 0, password: 0 } });
    }
  }

  // we check for the privateIds first since they are very likely non-numeric, but still have to check
  // here at the end in the case where a privateId happened to be purely numeric by chance
  return getPrivatePlaylistsWithId(playlistId, password);
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
		return [];
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
		playlist.initializeSongs(songs);

		// return the privateId of the new list
		return ourList.privateId;
	},
	checkPassword(playlistId, password){
		var nonNumeric = isNaN(playlistId);

		if(nonNumeric){
			var playlist = HostedPlaylists.findOne({privateId: playlistId});
			return checkPassword(playlist, password);
		}

		var intPlaylistId = parseInt(playlistId, 10);
		var publicPlaylist = HostedPlaylists.findOne({publicId: intPlaylistId});

		if(publicPlaylist){
			return checkPassword(publicPlaylist, password);
		}

		var privatePlaylist = HostedPlaylists.findOne({privateId: playlistId});
		return checkPassword(privatePlaylist, password);
	},
	getHostInfo: function (playlistId, authToken) {
		var user = Users.findOne({spotifyAuthToken: authToken});
		var playlist = HostedPlaylists.findOne(playlistId);

		if(user && playlist && user._id === playlist.userId){
		  return {hostToken: playlist.hostToken, privateId: playlist.privateId};
		}
		return null;
	},
	isValidHostToken: function(playlistId, hostToken){
		var playlist = HostedPlaylists.findOne(playlistId);
		if(playlist && playlist.hostToken && playlist.hostToken === hostToken){
			return true;
		}		
		return false;
	},
	syncUserWithServer(userId, token) {
		this.unblock();
		var response = null;

		// brand new user w/ no auth
		if(!userId && !token){
			var id = Users.insert({});
			return id;
		}

		// no-auth sync w/ userId
		if(userId && !token){
			var existingUser = Users.findOne({_id: userId});

			if(existingUser){
				return existingUser._id;
			}
			else{
				var id = Users.insert({});
				return id;
			}
		}

		// sync w/ spotify auth via token
		try
		{
			response = HTTP.get('https://api.spotify.com/v1/me', {headers: {
	           'Authorization': 'Bearer ' + token
	        }});
		}
		catch(ex)
		{
			console.log(ex);
			return null;
		}

		// if we have a valid spotify ID
		if(response && response.data && response.data.id){
			var spotifyUserId = response.data.id;

			// already have a jukebox userId
			if(userId){
				var existingUser = Users.findOne({_id: userId});

				// existing user already validated w/ spotify
				if(existingUser && existingUser.spotifyUserId === spotifyUserId){
					// update auth token
					Users.update(userId, {$set: { spotifyAuthToken: token }});
					return userId;
				}
				// existing user not already validated w/ spotify
				else if (existingUser){
					var existingSpotifyUser = Users.findOne({spotifyUserId: spotifyUserId});

					// if there is an account already w/ this user, then we just swap to that one
					if(existingSpotifyUser && existingSpotifyUser.spotifyUserId){
						// reset token
						Users.update(existingSpotifyUser._id, {$set: { spotifyAuthToken: token, spotifyUserId: spotifyUserId }});
						return existingSpotifyUser._id;
					}

					// otherwise, we have a new spotify validation so sync with current userId
					Users.update(userId, {$set: { spotifyUserId: spotifyUserId, spotifyAuthToken: token }});
					return userId;
				}
				// invalid userId
				else{
					// re-issue - doing this in case we reset the db and so stale userIds would be left in local storage if we didn't support this
					var id = Users.insert({spotifyUserId: spotifyUserId, spotifyAuthToken: token});
					return id;
				}
			}
			// new user altogether
			else{
				var id = Users.insert({spotifyUserId: spotifyUserId, spotifyAuthToken: token});
				return id;
			}
		}

		// don't this can logically be reached
		return null;
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
	pauseSong(playlistId, hostToken){
		var updateFunc = () => HostedPlaylists.update(playlistId, {$set: {isPaused: true}});
		return controlPlaylist(playlistId, hostToken, updateFunc);
	},
	unpauseSong(playlistId, hostToken){
		var updateFunc = () => HostedPlaylists.update(playlistId, {$set: {isPaused: false}});
		return controlPlaylist(playlistId, hostToken, updateFunc);
	},
	playNextSong(playlistId, hostToken){
		var updateFunc = () => {
			var playlist = HostedPlaylists.findOne(playlistId);
			if(playlist){
				playlist.playNextSong(/* fromHost */ false);
				return true;
			}
			return false;
		};
		return controlPlaylist(playlistId, hostToken, updateFunc);
	},
	playPreviousSong(playlistId, hostToken){
		var updateFunc = () => {
			var playlist = HostedPlaylists.findOne(playlistId);
			if(playlist){
				playlist.playPreviousSong(/* fromHost */ false);
				return true;
			}
			return false;
		};
		return controlPlaylist(playlistId, hostToken, updateFunc);
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

function controlPlaylist(playlistId, hostToken, updateFunction){
	var playlist = HostedPlaylists.findOne(playlistId);

	if(playlist){
		if(playlist.privateControl === false || (hostToken && hostToken === playlist.hostToken)){
			updateFunction();
			return true;
		}
		else{
			return false;
		}
	}
	return false;
};

function getPrivatePlaylistsWithId(playlistId, password){
	var playlist = HostedPlaylists.findOne({privateId: playlistId});

  	// check password if one is required
  	if(playlist && playlist.password){
  		if(playlist.password === password){
  			return HostedPlaylists.find({privateId: playlistId}, { fields: { hostToken: 0 } });
  		}
  		else{
  			return null;
  		}
  	}

    return HostedPlaylists.find({privateId: playlistId}, { fields: { hostToken: 0, password: 0 } });
};

function checkPassword(playlist, password){
	if(playlist){
		var requiresPassword = playlist.password ? true : false;
		return {
			requiresPassword: requiresPassword,
			incorrectPassword: requiresPassword && playlist.password !== password
		};
	}
	return null;
}