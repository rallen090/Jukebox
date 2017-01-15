import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Users } from './api/users.js';
import { HostedPlaylists } from './api/hosted-playlists.js';
import { Songs } from './api/songs.js';
 
import './debug.html';

Template.debug_page.onCreated(function bodyOnCreated() {
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
        var REDIRECT_URI = 'http://localhost:3000/create';
        function getLoginURL(scopes) {
            return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
              '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
              '&scope=' + encodeURIComponent(scopes.join(' ')) +
              '&response_type=token';
        }
        
        var url = getLoginURL([
            'user-read-email'
        ]);
        
        var width = 450,
            height = 730,
            left = (screen.width / 2) - (width / 2),
            top = (screen.height / 2) - (height / 2);
    
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

Template.debug_page.events({
    'click #btn-login'() {
      login(function(accessToken) {
            getUserData(accessToken)
                .then(function(response) {
                    loginButton.style.display = 'none';
                    alert(response);
                });
            });
  },
});