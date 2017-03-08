import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { HostedPlaylists } from './api/hosted-playlists.js';

import './services/geolocator.js';

import './welcome.html';

Template.welcome_page.helpers({

});

Template.welcome_page.events({
  'click #createJukebox'(event){
    window.location = window.location.protocol + "//" + window.location.host + "/create?useSpotify=true";
  },
  'click #joinJukebox'(event){
  	FlowRouter.go('Jukebox.join');
  },
});
