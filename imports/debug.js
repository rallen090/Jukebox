import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import SpotifyWebApi from'spotify-web-api-node';
import './services/spotify.js';
import './services/geolocator.js';

import { Users } from './api/users.js';
import { HostedPlaylists } from './api/hosted-playlists.js';
import { Songs } from './api/songs.js';
 
import './debug.html';

Template.debug_page.onCreated(function bodyOnCreated() {
});

Template.debug_page.onRendered(function debugOnRendered(){
  getCurrentCoordinates(function(position){
        console.log(position);

        console.log(getDistanceFromLatLonInMiles(position.coords.latitude, position.coords.longitude, position.coords.latitude, position.coords.longitude));
      },function(error){
        console.log(error);
      },function(){
        console.log("Geolocation not supported");
      });
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

Template.debug_page.events({
    'click #btn-login'() {
      acquireSpotifyAccessToken(/* reaquire */ true);
  },
  'click #btn-test'() {
      getUserPlaylists(function(response){
        alert(JSON.stringify(response));
      });
      //3V81yO5JWkFrXnwVZRV7CE
  },
  'click #btn-test2'() {
      getSongsForPlaylist('3V81yO5JWkFrXnwVZRV7CE', function(response){
        alert(JSON.stringify(response));
      });
      //3V81yO5JWkFrXnwVZRV7CE
  },
  'click #btn-test3'() {
      getCurrentCoordinates(function(position){
        console.log(position);
      },function(error){
        console.log(error);
      },function(){
        console.log("Geolocation not supported");
      });
  }
});