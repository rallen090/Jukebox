import { Session } from 'meteor/session';
import SpotifyWebApi from'spotify-web-api-node';

const CLIENT_ID = 'e03e15b112774918a9d3dfd5e2e78ba5';
const SPOTIFY_SCOPES = [
      //'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public'];
const SESSION_KEY_SPOTIFY_TOKEN = "jukebox-spotify-access-token"; 
const SESSION_KEY_ACTION = "jukebox-spotify-auth-action";

function spotifyLogin(callback, action) {
  var redirectUrl = window.location.href.split("#")[0]; // return to original URL

  // we store the redirect here since Spotify doesn't allow us to support dymanic URLs to which they redirect on their auth endpoint.
  // then we just restore this on /spotify/auth here
  Session.setPersistent("jukebox-spotify-auth-redirect", redirectUrl);

  // action argument is used to specify some action that should be executed upon return to the redirect URL after authentication.
  // for some spotify-related operations (e.g. reading user playlists) simply returning to the URL is enough, but for others
  // (e.g. save a playlist action) we must queue up an action to take place via this methodology
  if(action){
    Session.setPersistent(SESSION_KEY_ACTION, action);
  }

  var authRedirect = window.location.protocol + "//" + window.location.host + "/spotify/auth";

  function getLoginURL(scopes) {
      return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
        '&redirect_uri=' + encodeURIComponent(authRedirect) + 
        '&scope=' + encodeURIComponent(scopes.join(' ')) +
        '&response_type=token';
  }
  
  var url = getLoginURL(SPOTIFY_SCOPES);

  window.addEventListener("message", function(event) {
      var hash = JSON.parse(event.data);
      if (hash.type == 'access_token') {
          callback(hash.access_token);
      }
  }, false);
  
  window.location = url;
};

function ajaxWithReauthentication(ajaxRequestArguments, queuedAction){
	var failCount = 0;
	ajaxRequestArguments.error = function (ex){
    // spotify returns 201 created for some API endpoints, but ajax considers this onError
    if(ex && ex.status && ex.status === 201){
        return;
    }

		// assume first failure is because expires accessToken to re-auth
		if(failCount === 0){
      // so we clear the token and force a reacquisition of the token (note: important that we clear this, in case we fail again,
      // because otherwise we could be leaving around a stale token that could be re-tried again)
      Session.clear(SESSION_KEY_SPOTIFY_TOKEN);
			acquireSpotifyAccessToken(/* reacquire */ true, queuedAction);
		}
	};
	return $.ajax(ajaxRequestArguments);
};

// for storing and then later executing actions on separate pages (e.g. after an auth redirect).
// the passed in postActionMapping is run after a corresponding action if it exists (e.g. {save: saveFunc, create: createFunc}))
tryExecuteQueuedAction = function(postActionMapping){
  var actionInfo = Session.get(SESSION_KEY_ACTION);
  var accessToken = Session.get(SESSION_KEY_SPOTIFY_TOKEN);

  function postAction(){
    // run post-action
    var action = postActionMapping[actionInfo.action];
    if(action && typeof action === 'function'){
      action();
    };
  };

  // for save: must have the action + a token
  if(accessToken && actionInfo && actionInfo.action === "savePlaylist"){
    Session.clear(SESSION_KEY_ACTION);
    this.savePlaylist(actionInfo.playlistName, actionInfo.songUris, postAction);
  }
};

acquireSpotifyAccessToken = function acquireSpotifyAccessToken(reacquire, queuedAction) {
	const tokenKey = SESSION_KEY_SPOTIFY_TOKEN;

	var accessToken = Session.get(tokenKey);
	if(!accessToken || reacquire){
    // send to spotify
		spotifyLogin(function(accessToken) {
	    	Session.setPersistent(tokenKey, accessToken);
	    }, 
      // propogate any post-auth action
      queuedAction);
	}

	// otherwise, return the valid accessToken
	return accessToken;
};

getUserPlaylists = function (ajaxSuccessFunc) {
	var accessToken = acquireSpotifyAccessToken();

	return ajaxWithReauthentication({
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: ajaxSuccessFunc
    });
};

getSongsForPlaylist = function (playlistId, userId, ajaxSuccessFunc) {
	var accessToken = acquireSpotifyAccessToken();

  return ajaxWithReauthentication({
      url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks',
      headers: {
         'Authorization': 'Bearer ' + accessToken
      },
      success: ajaxSuccessFunc
  });
};

savePlaylist = function (playlistName, songUris, ajaxSuccessFunc) {
  // will queue this action if we have to first redirect to auth w/ spotify
  var queuedAction = {action: "savePlaylist", playlistName: playlistName, songUris: songUris};

  // note: we can assert that if we get a valid token then we have userId stored (this could be a cleaner system obviously...)
  var accessToken = acquireSpotifyAccessToken(/* reacquire */ false, queuedAction);

  // note: spotify has max songs per request set to 100
  var songIdBatches = [];
  var i, j, batchSize = 99;
  for (i = 0, j = songUris.length; i < j; i += batchSize) {
      songIdBatches.push(songUris.slice(i, i + batchSize));
  }

  // this is 3 API steps: 1. get current userId w/ token, 2. create, and 3. save songs
  var saveSongsToPlaylist = (userId, playlistId, url, batchIndex) => ajaxWithReauthentication({
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks',
        type: "POST",
        contentType: "application/json",
        dataType: "application/json",
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        data: JSON.stringify({ uris: songIdBatches[batchIndex] }),
        complete: function(response){
          if(response.status !== 201){
            return;
          }

          var jsonResponse = JSON.parse(response.responseText);

          var nextBatchIndex = batchIndex + 1;
          if(nextBatchIndex < songIdBatches.length && songIdBatches[nextBatchIndex].length > 0){
            saveSongsToPlaylist(userId, playlistId, url, nextBatchIndex);
          }
          else{
            // finally run the success function
            window.open(url, '_blank');
            ajaxSuccessFunc();
          }
        }
  });

  var createPlaylist = (userId) => ajaxWithReauthentication({
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
        type: "POST",
        contentType: "application/json",
        dataType: "application/json",
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        data: JSON.stringify({ name: playlistName }),
        // using complete instead of success because spotify return 201 Created codes here
        complete: function(response){
          if(response.status !== 201){
            return;
          }

          var jsonResponse = JSON.parse(response.responseText);

          // propogate userId and playlistId
          saveSongsToPlaylist(userId, jsonResponse.id, jsonResponse.external_urls.spotify, /* start batch index*/ 0);
        }
    } /* TODO: add failed action!*/);

  return ajaxWithReauthentication({
        url: 'https://api.spotify.com/v1/me',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: function(response){
          // propogate userId
          createPlaylist(response.id);
        }
    }, queuedAction);
};

searchArtists = function (query, ajaxSuccessFunc) {
  var accessToken = acquireSpotifyAccessToken();

  return ajaxWithReauthentication({
        url: 'https://api.spotify.com/v1/search?type=artist?q=' + encodeURIComponent(query),
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: ajaxSuccessFunc
    });
};

searchSongs = function (query, ajaxSuccessFunc) {
  var accessToken = acquireSpotifyAccessToken();

  return ajaxWithReauthentication({
        url: 'https://api.spotify.com/v1/search?type=track?q=' + encodeURIComponent(query),
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: ajaxSuccessFunc
    });
};