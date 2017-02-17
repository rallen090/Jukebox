import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
 
import './host.html';

Template.host_page.onRendered(function hostOnRendered(){
    var playlistPrivateId = FlowRouter.getParam('_id');
    var hostToken = FlowRouter.getQueryParam("hostToken");

    // android
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
        setTimeout(function () { window.location = "https://play.google.com/store/apps/details?id=com.facebook.katana"; }, 25);
        window.location = "jukeboxapp://host?hostToken=" + hostToken + "&privateId=" + playlistPrivateId;
        return;
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        setTimeout(function () { window.location = "https://play.google.com/store/apps/details?id=com.facebook.katana"; }, 25);
        window.location = "jukeboxapp://host?hostToken=" + hostToken + "&privateId=" + playlistPrivateId;
        return;
    }

    setTimeout(function(){
        $("#launchLoader").removeClass("active");
        $("#failedLaunch").show();
    }, 2000);
});