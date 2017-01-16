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
            description : "by " + artist,
            spotifyId: song.uri
          });
        });
        return response;
      },
    },
    minCharacters : 3,
    onSelect: function(result, response){
    	alert(JSON.stringify(result));
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