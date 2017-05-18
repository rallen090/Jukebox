import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Users } from './api/users.js';
import { HostedPlaylists } from './api/hosted-playlists.js';
 
import './map.html';

Template.map_page.onCreated(function settingsOnCreated() {
});

Template.map_page.onRendered(function settingsOnRendered(){
});

Template.map_page.helpers({
  playlist() {
    return HostedPlaylists.findOne();
  },
});

Template.map_page.events({
    'click #cancel'(event) {
      window.location.href = window.location.protocol + "//" + window.location.host + "/p/" + playlistId;
    }
});

var x=document.getElementById("demo");
function getLocation()
  {
  if (navigator.geolocation)
    {
      alert("FDSA");
    navigator.geolocation.getCurrentPosition(showPosition,showError);
    }
  else{x.innerHTML="Geolocation is not supported by this browser.";}
  }

function showPosition(position)
  {
    console.log(position);
    var latlon=position.coords.latitude+","+position.coords.longitude;

  var img_url="http://maps.googleapis.com/maps/api/staticmap?center="
  +latlon+"&zoom=14&size=400x300&sensor=false";
  document.getElementById("mapholder").innerHTML="<img src='"+img_url+"'>";
  }

function showError(error)
  {
  switch(error.code) 
    {
    case error.PERMISSION_DENIED:
      x.innerHTML="User denied the request for Geolocation."
      break;
    case error.POSITION_UNAVAILABLE:
      x.innerHTML="Location information is unavailable."
      break;
    case error.TIMEOUT:
      x.innerHTML="The request to get user location timed out."
      break;
    case error.UNKNOWN_ERROR:
      x.innerHTML="An unknown error occurred."
      break;
    }
  }