import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from './api/hosted-playlists.js';

import './services/geolocator.js';

import './welcome.html';

// storing playlists in a client-side meteor collection so they can load and be rendered dynamically (i.e. won't block page load)
var NearbyPlaylists = new Meteor.Collection(null);

Template.welcome_page.onRendered(function playPageOnCreated() {
//$("#nearby-playlists").hide();
});

Template.welcome_page.helpers({
  nearbyPlaylists(){
    return NearbyPlaylists.find({}, {sort: { distanceInMiles: 1 }});
  }
});

Template.welcome_page.events({
  'click #js-party-joiner'() {
  	var playlistId = parseInt($('#playlist-id').val(), 10);
    var playlist = HostedPlaylists.findOne({publicId: playlistId});

    if(!playlist){
      $('#invalidPlaylistAlert').display;
    } 
    else {
      FlowRouter.go('Jukebox.playlist', { _id: playlistId });
    }
  },
  'click #nearby-button'() {
    // load coordinates
    getCurrentCoordinates(function(position){
      var lat = position.coords.latitude;
      var long = position.coords.longitude;

      // iterate over only doc with lat/long
      if(HostedPlaylists.find().count()){
        var count = 0;
        HostedPlaylists.find({latitude: { $exists: true }}, {longitude: { $exists: true }}).forEach(function (row) {
            if(row){
              console.log({a: lat, b: long, c: row.latitude, d: row.longitude});
              var distance = getDistanceFromLatLonInMiles(lat, long, row.latitude, row.longitude);
              if(distance < /* max miles */ 5){
                var roundedDistance = Math.round( distance * 10 ) / 10;
                NearbyPlaylists.insert({name: row.name, publicId: row.publicId, distanceInMiles: roundedDistance});
                count++;
              }
            }
        }); 

        if(count > 0){
          $("#nearby-button").text("Nearby playlists");
          $("#selectable-playlists").show();
        }
        else{
          $("#nearby-button").html("No playlists nearby");
          $("#nearby-button").prop('disabled', true);
        }
      }
      else{
        $("#nearby-button").html("No playlists");
        $("#nearby-button").prop('disabled', true);
      }

    },function(error){
      console.log("Geo error: " + error);
      $("#nearby-button").html("Failed acquiring geolocation");
      $("#nearby-button").prop('disabled', true);
    },function(){
      console.log("Geolocation not supported");
      $("#nearby-button").html("Geolocation not supported on device");
      $("#nearby-button").prop('disabled', true);
    });
  },
  'click li'(event) {
    // get the public id - we store the public id on the rows of the list so it is easy to grab it when a row is clicked
    var playlistPublicId = event.target.id;

    FlowRouter.go('Jukebox.playlist', { _id: playlistPublicId });
  }
});
