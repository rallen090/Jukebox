//import { HostedPlaylists } from '../api/hosted-playlists.js';

if (Meteor.isServer) {
  // var Api = new Restivus({
  //   useDefaultAuth: true,
  //   prettyJson: true
  // });

  // Api.addCollection(HostedPlaylists);

  // // maps to /api/playlist/next/:id
  // Api.addRoute('playlist/next/:id', {authRequired: false}, {
  //   get: function () {
  //     var playlist = HostedPlaylists.findOne({publicId: parseInt(this.urlParams.id, 10)});

  //     if(!playlist){
  //       return { message: "Playlist does not exist", endOfPlaylist: "true" };
  //     }

  //     var nextSong = playlist.playNextSong();

  //     if(!nextSong){
  //       return { message: "Playlist is now empty", endOfPlaylist: "true" };
  //     }

  //     return { nextSong: nextSong, endOfPlaylist: "false" };
  //   }
  // });

  // // maps to /api/playlists/:id
  // Api.addRoute('playlist/isvalid/:id', {authRequired: false}, {
  //   get: function () {
  //     var playlist = HostedPlaylists.findOne({publicId: parseInt(this.urlParams.id, 10)});
  //     return { isValid: playlist ? "true" : "false" };
  //   }
  // });
}