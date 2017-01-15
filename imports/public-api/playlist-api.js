import { HostedPlaylists } from '../api/hosted-playlists.js';

if (Meteor.isServer) {
  var Api = new Restivus({
    useDefaultAuth: true,
    prettyJson: true
  });

  Api.addCollection(HostedPlaylists);

  // maps to /api/playlists/:id
  Api.addRoute('play/next/:id', {authRequired: false}, {
    post: function () {
      var playlist = HostedPlaylists.findOne({publicId: parseInt(this.urlParams.id, 10)});

      if(!playlist){
        return { message: "Playlist does not exist" };
      }

      return playlist.playNextSong();
    }
  });
}