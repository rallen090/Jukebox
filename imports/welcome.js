import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from './api/hosted-playlists.js';

import './services/geolocator.js';

import './welcome.html';

// storing playlists in a client-side meteor collection so they can load and be rendered dynamically (i.e. won't block page load)
var NearbyPlaylists = new Meteor.Collection(null);

Template.welcome_page.onCreated(function playPageOnCreated() {
});

Template.welcome_page.helpers({
  nearbyPlaylist(){
    return NearbyPlaylists.find();
  }
});

Template.welcome_page.events({
  'click #js-party-joiner'() {
  	var playlistId = parseInt($('#playlist-id').val(), 10);
    var playlist = HostedPlaylists.findOne({publicId: playlistId});

    if(!playlist){
      $('#invalidPlaylistAlert').display;;
    } 
    else {
      FlowRouter.go('Jukebox.playlist', { _id: playlistId });
    }
  },
  'click #nearby-button'() {
    $("#nearby-button").addClass("loading");

    // load coordinates
    getCurrentCoordinates(function(position){
      var lat = position.coords.latitiude;
      var long = position.coords.longitude;

      // iterate over only doc with lat/long
      if(HostedPlaylists.find().count()){
        $.each(HostedPlaylists.find({latitude: { $exists: true }}, {longitude: { $exists: true }}), function( index, value ) {
        console.log(value());
          if(value){
            var distance = getDistanceFromLatLonInMiles(lat, long, value.latitude, value.longitude);
            alert("Distance: " + distance);
            if(distance < /* max miles */ 5){
              NearbyPlaylists.insert({name: value.name, publicId: value.publicId, distanceInMiles: distance});
            }
          }
        });
        $("#nearby-button").hide();
      }
      else{
        $("#nearby-button").html("No playlists");
        $("#nearby-button").prop('disabled', true);
        $("#nearby-button").removeClass("loading");
      }

    },function(error){
      console.log("Geo error: " + error);
      $("#nearby-button").html("Failed acquiring geolocation");
      $("#nearby-button").prop('disabled', true);
      $("#nearby-button").removeClass("loading");
    },function(){
      console.log("Geolocation not supported");
      $("#nearby-button").html("Geolocation not supported on device");
      $("#nearby-button").prop('disabled', true);
      $("#nearby-button").removeClass("loading");
    });

    // if(!playlist){
    //   $('#invalidPlaylistAlert').display;;
    // } 
    // else {
    //   FlowRouter.go('Jukebox.playlist', { _id: playlistId });
    // }
  },
});
