import { HostedPlaylists } from '../api/hosted-playlists.js';

import crypto from 'crypto';
import base64url from 'base64url';

const CLIENT_ID = 'e03e15b112774918a9d3dfd5e2e78ba5';
const CLIENT_SECRET_ID = "0d5bd36c030b41e886f813ff10096228";
const ENCRYPTION_SECRET = "cFJLyifeUJUBFWdHzVbykfDmPHtLKLGzViHW9aHGmyTLD8hGXC";
const CLIENT_CALLBACK_URL = "jukebox-login://callback";
const SPOTIFY_BASE_URL = "https://accounts.spotify.com";

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

      HostedPlaylists.update(playlist._id, {$set: {isPaused: true}});

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

      var nextSongId = playlist.playPreviousSong(/* fromHost */ true);

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

  Api.addRoute('v2/spotify/auth/swap', {authRequired: false}, {
    post: function () {
      console.log("MADE IT!");
      var authCode = this.bodyParams.code;
      console.log(this.bodyParams.code);

      var response = HTTP.call(
        "POST", 
        SPOTIFY_BASE_URL + "/api/token", 
        {params: {grant_type: "authorization_code", redirect_uri: CLIENT_CALLBACK_URL, code: authCode}, auth: CLIENT_ID + ":" + CLIENT_SECRET_ID});

      if(response && response.data){
        var accessToken = response.data.access_token;
        var refreshToken = response.data.refresh_token;
        var encryptedRefreshToken = crypto.publicEncrypt(ENCRYPTION_SECRET, refreshToken);
        response.data.refresh_token = encryptedRefreshToken;
        return response.data;
      }
      // # encrypt the refresh token before forwarding to the client
      // if response.code.to_i == 200
      //     token_data = JSON.parse(response.body)
      //     refresh_token = token_data["refresh_token"]
      //     encrypted_token = refresh_token.encrypt(:symmetric, :password => ENCRYPTION_SECRET)
      //     token_data["refresh_token"] = encrypted_token
      //     response.body = JSON.dump(token_data)
      // end

      // status response.code.to_i
      // return response.body
      return response.data;
    }
  });

  Api.addRoute('v2/spotify/auth/refresh', {authRequired: false}, {
    post: function () {
      var refreshToken = this.bodyParams.refresh_token;

      var response = HTTP.call(
        "POST", 
        SPOTIFY_BASE_URL + "/api/token", 
        {params: {grant_type: "refresh_token", refresh_token: crypto.publicDecrypt(ENCRYPTION_SECRET, refreshToken)}, auth: CLIENT_ID + ":" + CLIENT_SECRET_ID});

      return response.data;
    }
  });
}