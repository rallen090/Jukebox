import { Session } from 'meteor/session';
import SpotifyWebApi from'spotify-web-api-node';

const CLIENT_ID = 'e03e15b112774918a9d3dfd5e2e78ba5';

function spotifyLogin(callback) {
  var redirectUrl = window.location.href.split("#")[0]; // return to original URL

  // we store the redirect here since Spotify doesn't allow us to support dymanic URLs to which they redirect on their auth endpoint.
  // then we just restore this on /spotify/auth here
  Session.setPersistent("jukebox-spotify-auth-redirect", redirectUrl);

  var authRedirect = window.location.protocol + "//" + window.location.host + "/spotify/auth";
  function getLoginURL(scopes) {
      return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
        '&redirect_uri=' + encodeURIComponent(authRedirect) + 
        '&scope=' + encodeURIComponent(scopes.join(' ')) +
        '&response_type=token';
  }
  
  var url = getLoginURL([
      'user-read-email'
  ]);

  window.addEventListener("message", function(event) {
      var hash = JSON.parse(event.data);
      if (hash.type == 'access_token') {
          callback(hash.access_token);
      }
  }, false);
  
  window.location = url;
};

function getUserPlaylistsInternal(accessToken, userId, ajaxSuccessFunc) {
    return $.ajax({
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: ajaxSuccessFunc
    });
};

function getSongsForPlaylistInternal(accessToken, userId, playlistId, ajaxSuccessFunc) {
    return $.ajax({
        url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: ajaxSuccessFunc
    });
};

function ajaxWithReauthentication(ajaxRequestArguments){
	var failCount = 0;
	ajaxRequestArguments.error = function (ex){
		// assume first failure is because expires accessToken to re-auth
		if(failCount === 0){
			acquireSpotifyAccessToken(/* reacquire */ true)
		}
	};
	return $.ajax(ajaxRequestArguments);
};

acquireSpotifyAccessToken = function acquireSpotifyAccessToken(reacquire = false) {
	const tokenKey = "jukebox-spotify-access-token";
	var accessToken = Session.get(tokenKey);
	if(!accessToken || reacquire){
		spotifyLogin(function(accessToken) {
	    	Session.setPersistent(tokenKey, accessToken);
	    });
	}

	// otherwise, return the valid accessToken
	return accessToken;
};

getUserPlaylists = function (ajaxSuccessFunc) {
	var accessToken = acquireSpotifyAccessToken();

	return ajaxWithReauthentication({
        url: 'https://api.spotify.com/v1/me',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: function(response){
        	getUserPlaylistsInternal(accessToken, response.id, ajaxSuccessFunc);
        }
    });
};

getSongsForPlaylist = function (playlistId, ajaxSuccessFunc) {
	var accessToken = acquireSpotifyAccessToken();

	return ajaxWithReauthentication({
        url: 'https://api.spotify.com/v1/me',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: function(response){
        	getSongsForPlaylistInternal(accessToken, response.id, playlistId, ajaxSuccessFunc);
        }
    });
};