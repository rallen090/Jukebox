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
	    	setTimeout(function(){ $("#search-input").select();}, 150);

	    	Songs.insert({
		        spotifyId: spotifyId,
		        name: result.title,
		        artist: result.artist,
		        hostedPlaylistId: playlistId
		    });
	    }
	  })
	;

	// adjusting the search results to fill the whole window (the component is built in a way where we must apply this dynamically)
	function adjustResultsBox (){
		setTimeout(function(){
			var box = $(".ui .results");
			if(box && box.offset() && box.offset().left > 0){
				// box.css('margin-left','-' + (box.offset().left - 50) + 'px');
				box.css('width', ($(document).width()) + 'px');
			}
			else{
				adjustResultsBox();
			}
		}, 200);
	};

	adjustResultsBox();

  this.autorun(() => {
  });
});

Template.search.helpers({
});

Template.search.events({
	// scroll to place search on top of page when pressed
	'click #search-input'(event) {
		$("#height-extender").show();

		$('html, body').animate({
	        scrollTop: $("#search-input").offset().top
	    }, 500);
	 },
	 // on-enter key press handler
	 'keydown .input'(event) {
	 	var input = $("#search-input");
	 	if(event.which === 13){
	 		if($("#search-input").val() === "do a barrel roll"){
		 		var barrelRollCss = "\
					.result {\
					-moz-animation-name: roll;\
					-moz-animation-duration: 5s;\
					-moz-animation-iteration-count: 1;\
					-webkit-animation-name: roll;\
					-webkit-animation-duration: 5s;\
					-webkit-animation-iteration-count: 1;\
					}";
	 			var style = document.createElement('style');
				style.type = 'text/css';
				style.innerHTML = barrelRollCss;
				$('head').append(style);
	 		}

	 		//input.attr('readonly', true);
	 	}
	 	// NOTE: this readonly attr solution for closing mobile keyboards does not seem to work - we should find a alternative solution
	 	// else if(input.attr('readonly')){
	 	// 	if ((event.which >= 48 && event.which <= 57) || (event.which >= 65 && event.which <= 90)){
	 	// 		input.val(input.val() + event.key);
	 	// 	}
	 	// 	else if(event.which === 8){
	 	// 		input.val(input.val().slice(0, -1));
	 	// 	}

			// input.attr('readonly', false);
	 	// }
	 }
});