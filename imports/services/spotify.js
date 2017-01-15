import { Session } from 'meteor/session';
import SpotifyWebApi from'spotify-web-api-node';

const CLIENT_ID = 'e03e15b112774918a9d3dfd5e2e78ba5';

function spotifyLogin(callback) {
  var redirectUrl = window.location.protocol + '//' + window.location.host + '/create';
  function getLoginURL(scopes) {
      return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
        '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
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

function getUserData(accessToken) {
    return $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        }
    });
};

export function acquireSpotifyAccessToken() {
	var token = Session.get("jukebox-spotify-access-token");

	function tryVerifyAuthenticatedWithSpotify(){
		try{
			getUserData(token);
			return true;
		}
		catch(ex){
			return false;
		}
	};

	// if we lack a token OR if we can't access an endpoint, then we force a re-login
	if(!token || !tryVerifyAuthenticatedWithSpotify()){
		spotifyLogin(function(accessToken) {
        getUserData(accessToken)
            .then(function(response) {
                loginButton.style.display = 'none';
                alert(response);
            });
        });
	}

	// otherwise, return the valid token
	return token;
};

export function getUserPlaylists(ajaxSuccessFunc) {
	var token = acquireSpotifyAccessToken();



	return $.ajax({
        url: 'https://api.spotify.com/v1/users/' + + '/playlists',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: ajaxSuccessFunc
    });
};

export function getSongsForPlaylist(playlistId, ajaxSuccessFunc) {
	var token = acquireSpotifyAccessToken();

	return $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
           'Authorization': 'Bearer ' + accessToken
        },
        success: ajaxSuccessFunc
    });
};