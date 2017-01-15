import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import SpotifyWebApi from'spotify-web-api-node';

import { Users } from './api/users.js';
import { HostedPlaylists } from './api/hosted-playlists.js';
import { Songs } from './api/songs.js';
 
import './debug.html';

Template.debug_page.onCreated(function bodyOnCreated() {
  // TODO: needed for user-permission authentication + refresh of tokens
  // var code = location.search.split('code=')[1];
  // if(code){
  //   var credentials = {
  //     clientId : 'e03e15b112774918a9d3dfd5e2e78ba5',
  //     clientSecret : '0d5bd36c030b41e886f813ff10096228',
  //     redirectUri : window.location.protocol + '//' + window.location.host + '/debug'
  //   };

  //   var spotifyApi = new SpotifyWebApi(credentials);

  //   // Retrieve an access token and a refresh token
  //   spotifyApi.authorizationCodeGrant(code)
  //     .then(function(data) {
  //       console.log('The token expires in ' + data.body['expires_in']);
  //       console.log('The access token is ' + data.body['access_token']);
  //       console.log('The refresh token is ' + data.body['refresh_token']);

  //       // Set the access token on the API object to use it in later calls
  //       spotifyApi.setAccessToken(data.body['access_token']);
  //       spotifyApi.setRefreshToken(data.body['refresh_token']);
  //     }, function(err) {
  //       console.log('Something went wrong!', err);
  //     });
  // }
});

Template.debug_page.helpers({
  users() {
    return Users.find();
  },
  hostedPlaylists() {
    return HostedPlaylists.find();
  },
  songs() {
    return Songs.find();
  },
});

function login(callback) {
        var CLIENT_ID = 'e03e15b112774918a9d3dfd5e2e78ba5';
        var REDIRECT_URI = window.location.protocol + '//' + window.location.host + '/create';
        alert(REDIRECT_URI);
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
          alert("FDSA");
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

Template.debug_page.events({
    'click #btn-login'() {
//       var scopes = ['user-read-private', 'user-read-email'],
//     redirectUri = window.location.protocol + '//' + window.location.host + '/debug';
//     clientId = 'e03e15b112774918a9d3dfd5e2e78ba5',
//     state = 'some-state-of-my-choice';

// // Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
// var spotifyApi = new SpotifyWebApi({
//   redirectUri : redirectUri,
//   clientId : clientId
// });

// // Create the authorization URL
// var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
// window.location = authorizeURL;

      login(function(accessToken) {
            getUserData(accessToken)
                .then(function(response) {
                    loginButton.style.display = 'none';
                    alert(response);
                });
            });
  },
  'click #btn-test'() {
      var accessToken = "BQAkKv9_9oGgTGioKJunug3IERF0CKAgv1YPkOgexEApqIxJPPFqYLKfsn6imIkrKRhTkk4JDmH2AA0ShGHgvJo3Ev7zpQZyEEstlaiXOTUtFY_InV5Ozh2SSFqpH5ZYcd95b0lZ4l_FQnBglfk0cvM0-CbuKg";

      var spotifyApi = new SpotifyWebApi({
        accessToken: accessToken
      });

      spotifyApi.getMe()
        .then(function(data) {
          alert(data.body);
        }, function(err) {
          alert(err);
        });
  }
});