import { HostedPlaylists } from '../api/hosted-playlists.js';

import winston from 'winston';
import crypto from 'crypto';
import base64url from 'base64url';

const CLIENT_ID = 'e03e15b112774918a9d3dfd5e2e78ba5';
const CLIENT_SECRET_ID = "0d5bd36c030b41e886f813ff10096228";
const ENCRYPTION_SECRET = "cFJLyifeUJUBFWdHzVbykfDmPHtLKLGzViHW9aHGmyTLD8hGXC";
const CLIENT_CALLBACK_URL = "jukebox://callback";
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
      winston.info("Swapping auth code", this.bodyParams);
      var authCode = this.bodyParams.code;

      try{
        var response = HTTP.call(
          "POST", 
          SPOTIFY_BASE_URL + "/api/token", 
          {params: {grant_type: "authorization_code", redirect_uri: CLIENT_CALLBACK_URL, code: authCode}, auth: CLIENT_ID + ":" + CLIENT_SECRET_ID});

        if(response && response.data){
          winston.info("Swap response", response.data);
          // var accessToken = response.data.access_token;
          // var refreshToken = response.data.refresh_token;
          // var encryptedRefreshToken = crypto.publicEncrypt(ENCRYPTION_SECRET, refreshToken);
          // response.data.refresh_token = encryptedRefreshToken;
          return response.data;
        }
        else{
          winston.error("Error response swapping auth code", response);
          return response;
        }
      }
      catch(ex){
        winston.error("Error swapping auth code", ex);
        return ex;
      }
    }
  });

  Api.addRoute('v2/spotify/auth/refresh', {authRequired: false}, {
    post: function () {
      winston.info("Refreshing auth token", this.bodyParams);
      var refreshToken = this.bodyParams.refresh_token;

      try{
        var response = HTTP.call(
        "POST", 
        SPOTIFY_BASE_URL + "/api/token", 
        {params: {grant_type: "refresh_token", refresh_token: refreshToken}, auth: CLIENT_ID + ":" + CLIENT_SECRET_ID});

        if(response && response.data){
          winston.info("Refresh response", response.data);
          // var accessToken = response.data.access_token;
          // var refreshToken = response.data.refresh_token;
          // var encryptedRefreshToken = crypto.publicEncrypt(ENCRYPTION_SECRET, refreshToken);
          // response.data.refresh_token = encryptedRefreshToken;
          return response.data;
        }
        else{
          winston.error("Error response refreshing auth token", response);
          return response;
        }
      }
      catch(ex){
        winston.error("Error refreshing auth token", ex);
        return ex;
      }
    }
  });
}