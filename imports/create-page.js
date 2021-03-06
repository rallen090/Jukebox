import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Session } from 'meteor/session';
import { HostedPlaylists } from './api/hosted-playlists.js';

import './services/spotify.js';
import './services/geolocator.js';

import './create-page.html';

// storing playlists in a client-side meteor collection so they can load and be rendered dynamically (i.e. won't block page load)
var SpotifyPlaylists = new Meteor.Collection(null);
var useSpotify = () => FlowRouter.getQueryParam("useSpotify");

Template.create_page.onCreated(function createPageOnCreated() {
  var useSpotifyParam = useSpotify();
  var loadFromSpotify = useSpotifyParam && (useSpotifyParam === true || useSpotifyParam === "true");

  // populate playlists
  if(loadFromSpotify && SpotifyPlaylists.find().count() === 0 && SpotifyPlaylists.find({soungCount: {$gt : 0}}).count() === 0){
    // get user playlists (auth redirect if necessary)
    getUserPlaylists(function(response){
      var items = response.items;
      $.each(items, function( index, value ) {
        if(value){
          SpotifyPlaylists.insert({
          spotifyId: value.id,
          ownerId: value.owner.id,
          name: value.name,
          imgUrl: value.images.url,
          songCount: value.tracks.total
        });
        }
      });
    })
  }

  this.autorun(() => {
  });
});

Template.create_page.onRendered(function createPageOnRendered() {
    var useSpotifyParam = useSpotify();
    if((useSpotifyParam !== null && (useSpotifyParam === "false" || useSpotifyParam === false))){
      $('#invalidAlert').show();
    }

    getCurrentCoordinates(function(position){
        Session.set("jukebox-current-longitude", position.coords.longitude);
        Session.set("jukebox-current-latitude", position.coords.latitude);
      },function(error){
        console.log("Geo error: " + error);
      },function(){
        console.log("Geolocation not supported");
      });

  this.autorun(() => {
  });
});

Template.create_page.helpers({
  playlists(){
    return SpotifyPlaylists.find({songCount: {$ne: 0}});
  }
});

Template.create_page.events({
  'click li'(event) {
    $("#create-load").addClass("active");

    // name
    var playlistName = $('#playlist-name').val();

    // we set the spotifyId on the actual list element to it is easy to access here without referencing the meteor collection
    var spotifyPlaylistId = event.target.id;

    // geo
    var longitude = Session.get("jukebox-current-longitude");
    var latitude = Session.get("jukebox-current-latitude");
    Session.clear("jukebox-current-longitude");
    Session.clear("jukebox-current-latitude");

    var playlistSongs = [];
    function savePlaylistAndSongs(name, spotifyOwnerId, songs){
      var playlist = {
        name: name,
        userId: Session.get("jukebox-active-user-id"),
        latitude: latitude,
        longitude: longitude
      };
      Meteor.call('createPlaylist', playlist, songs, function(error, result){
        if(error || !result){
          window.alert("Error creating playlist! Please try again.");
          window.location.href = window.location.origin;
        }

        var privateId = result;

        // then redirect to the new playlist
        FlowRouter.go('Jukebox.playlist', { _id: privateId });
      });
    };
    
    // if a spotify playlist was chosen, then populate songs from that
    if(spotifyPlaylistId){
      var spotifyOwnerId = SpotifyPlaylists.findOne({spotifyId: spotifyPlaylistId}).ownerId;
      getSongsForPlaylist(spotifyPlaylistId, spotifyOwnerId, function(response){
        var rawSongs = response.items;

        // convert response to playlistSongs to insert
        $.each(rawSongs, function( index, value ) {
          var track = value.track;

          // TODO: this is duplicated logic from search - we should consolidate
          var imageUrl = null;            
          if(track.album && track.album.images && track.album.images.length > 0){
            imageUrl = track.album.images.sort(function(a, b){
            if (a.height < b.height)
              return -1;
            if (a.height > b.height)
              return 1;
            return 0;
            })[0].url; // take first, which is smallest after sorting
          }  

          playlistSongs.push({
            name: track.name,
            artist: track.artists[0].name,
            // track.id is the ID portion only - while track.uri has the 'spotify:track:' prefix as well
            spotifyId: track.uri,
            imageUrl: imageUrl,
            durationInSeconds: track.duration_ms ? parseInt(track.duration_ms) / 1000 : 0
          });
        });

        // save and redirect
        savePlaylistAndSongs(playlistName, spotifyOwnerId, playlistSongs);
      });
    }
    // otherwise, submit with an empty playlist
    else{
      savePlaylistAndSongs(playlistName, null, playlistSongs);
    }
  }
});