import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import './services/spotify.js'; 

import './search.html';

Template.search.onCreated(function bodyOnCreated() {
});

Template.search.onRendered(function createPageOnRendered() {
  	$('.ui.search')
  .search({
    apiSettings: {
      url: 'https://api.spotify.com/v1/search?q={query}&type=artist,track',
      onResponse: function(spotifyResponse) {
        var
          response = {
            results : {}
          }
        ;

        function createCategory(categoryName){
        	if(response.results[categoryName] === undefined) {
	            response.results[categoryName] = {
	              name    : categoryName,
	              results : []
	            };
	          }
        };
        
        createCategory("Artists");
        createCategory("Songs");

        // translate Spotify API response to work with search
        $.each(spotifyResponse.artists.items, function(index, artist) {
          if(index >= 4) {
            return false;
          }

          // add result to category
          response.results["Artists"].results.push({
            title       : artist.name,
            url         : window.location.href
          });
        });
        $.each(spotifyResponse.tracks.items, function(index, song) {
          if(index >= 4) {
            return false;
          }

          // add result to category
          response.results["Songs"].results.push({
            title       : song.name,
            description : "by " + song.artists[0].name,
            url         : window.location.href
          });
        });
        return response;
      },
    },
    minCharacters : 3,
    type: 'category'
  })
;

  this.autorun(() => {
  });
});

Template.search.helpers({
});

Template.search.events({
});