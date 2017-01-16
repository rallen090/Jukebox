import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Songs } from './api/songs.js';

import './services/spotify.js'; 

import './search.html';

Template.search.onCreated(function bodyOnCreated() {
});

Template.search.onRendered(function createPageOnRendered() {
	var playlistId = $("#playlistId").text();
	if(!playlistId){
		$('.ui.search').html("");
		throw "Argument exception: must pass in 'playlistId' to the 'search' meteor template";
	}

  	$('.ui.search')
	  .search({
	    apiSettings: {
	      url: 'https://api.spotify.com/v1/search?q={query}&type=track',
	      onResponse: function(spotifyResponse) {
	        var
	          response = {
	            results : []
	          }
	        ;

	        // translate Spotify API response to work with search
	        $.each(spotifyResponse.tracks.items, function(index, song) {
	          if(index >= 10) {
	            return false;
	          }

	          var artist = song.artists[0].name;
	          response.results.push({
	            title       : song.name,
	            artist 	: artist,
	            description : "by " + artist,
	            spotifyId: song.uri
	          });
	        });
	        return response;
	      },
	    },
	    minCharacters : 3,
	    onSelect: function(result, response){
	    	var spotifyId = result.spotifyId;

	    	// the semenatic-ui search component is manipulating the box right after the selection, so we need to wait a short period
	    	// before we do anything to it, othertwise our changes are overwritten
	    	setTimeout(function(){ $("#search-input").select();}, 50);

	    	Songs.insert({
		        spotifyId: spotifyId,
		        name: result.title,
		        artist: result.artist,
		        hostedPlaylistId: playlistId
		    });
	    }
	  })
	;

  this.autorun(() => {
  });
});

Template.search.helpers({
});

Template.search.events({
});