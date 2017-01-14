import { Template } from 'meteor/templating';
 
import './playlist.html';
 
Template.body.helpers({
  playlist: [
    { name: 'Song 1', artist: "Artist 1" },
    { name: 'Song 2', artist: "Artist 2" },
    { name: 'Song 3', artist: "Artist 3" },
  ],
});
