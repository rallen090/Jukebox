/* global alert */

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { $ } from 'meteor/jquery';

import './app-body.html';

Meteor.startup(() => {

});

Template.App_body.onCreated(function appBodyOnCreated() {
  this.subscribe('jukeboxUsers');
  this.subscribe('playlists');
  this.subscribe('songs');
});

Template.App_body.helpers({

});

Template.App_body.events({

});
