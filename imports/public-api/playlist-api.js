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

  // ---- v2 API ----

  Api.addRoute('v2/playlist/play/:privateId', {authRequired: false}, {
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

      var nextSongId = playlist.playNextSong(/* fromtHost */ true);

      if(!nextSongId){
        return { success: false, message: "Playlist is now empty", nextSongId: null, endOfPlaylist: "true" };
      }

      return { success: true, message: "Playing", nextSongId: nextSongId, endOfPlaylist: "false" };
    }
  });

  Api.addRoute('v2/playlist/pause/:privateId', {authRequired: false}, {
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

      HostedPlaylists.update(playlistId, {$set: {isPaused: true}});

      return { success: true, message: "Paused" };
    }
  });

  Api.addRoute('v2/playlist/previous/:privateId', {authRequired: false}, {
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

      var nextSongId = playlist.playPreviousSong(/* fromtHost */ true);

      if(!nextSongId){
        return { success: false, message: "Playlist is now empty", nextSongId: null, endOfPlaylist: "true" };
      }

      return { success: true, message: "Previous", nextSongId: nextSongId, endOfPlaylist: "false" };
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