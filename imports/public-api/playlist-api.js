import { HostedPlaylists } from '../api/hosted-playlists.js';

const FAILURE_403 = {
  statusCode: 403,
  success: false,
  headers: {
    'Content-Type': 'text/plain'
  },
  body: 'Not authorized (1)'
};

if (Meteor.isServer) {
  var Api = new Restivus({
    useDefaultAuth: true,
    prettyJson: true
  });

  Api.addCollection(HostedPlaylists);

  // TODO: remove legacy API
  // maps to /api/playlist/next/:id
  Api.addRoute('playlist/next/:id', {authRequired: false}, {
    get: function () {
      var playlist = HostedPlaylists.findOne({publicId: parseInt(this.urlParams.id, 10)});

      if(!playlist){
        return { message: "Playlist does not exist", endOfPlaylist: "true" };
      }

      var nextSong = playlist.playNextSong(/* fromtHost */ true);

      if(!nextSong){
        return { message: "Playlist is now empty", endOfPlaylist: "true" };
      }

      return { nextSong: nextSong, endOfPlaylist: "false" };
    }
  });

  // maps to /api/playlists/:id
  Api.addRoute('playlist/isvalid/:id', {authRequired: false}, {
    get: function () {
      var playlist = HostedPlaylists.findOne({publicId: parseInt(this.urlParams.id, 10)});
      return { isValid: playlist ? "true" : "false" };
    }
  });

  // ---- v2 API ----

  Api.addRoute('v2/playlist/play/:privateId', {authRequired: false}, {
    post: function () {
      var urlId = this.urlParams.privateId;
      var hostToken = this.bodyParams.hostToken;
      var hostToken = this.bodyParams.userId;

      // invalid post arguments
      if(!urlId || !hostToken){
        return FAILURE_403;
      }

      var playlist = HostedPlaylists.findOne({privateId: urlId, hostToken: hostToken});

      // invalid playlist id and/or hostToken
      if(!playlist){
        return FAILURE_403;
      }

      var nextSongId = playlist.playNextSong(/* fromtHost */ true);

      if(!nextSong){
        return { success: false, message: "Playlist is now empty", nextSong: null, endOfPlaylist: "true" };
      }

      return { success: true, message: "Playing", nextSong: nextSong, endOfPlaylist: "false" };
    }
  });

  Api.addRoute('v2/playlist/status/:privateId', {authRequired: false}, {
    post: function () {
      var urlId = this.urlParams.privateId;
      var hostToken = this.bodyParams.hostToken;

      // invalid post arguments
      if(!urlId || !hostToken){
        return FAILURE_403;
      }

      var playlist = HostedPlaylists.findOne({privateId: urlId, hostToken: hostToken});

      // invalid playlist id and/or hostToken
      if(!playlist){
        return FAILURE_403;
      }

      var results = playlist.checkStatus();

      if(!results){
        return FAILURE_403;
      }

      // add on additional content
      results.success = true;
      results.message = "Playlist status";

      return results;
    }
  });
}