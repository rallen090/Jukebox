import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
 
import './host.html';

Template.host_page.onRendered(function hostOnRendered(){
    var hostToken = FlowRouter.getQueryParam("hostToken");
    var playlistPrivateId = FlowRouter.getQueryParam("privateId");

    setTimeout(function(){
        window.close();
        // $("#launchLoader").removeClass("active");
        // $("#failedLaunch").show();
    }, 5000);

    // android
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
        var timer = setTimeout(function () {
            window.location.href = "http://www.playjuke.com/android";
            // window.location = "https://play.google.com/store/apps/details?id=com.facebook.katana"; 
        }, 3000);
        window.location.replace("jukeboxapp://host?hostToken=" + hostToken + "&privateId=" + playlistPrivateId);
        return;
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        setTimeout(function () { window.location = "itms://itunes.apple.com/app/facebook/id284882215"; }, 3000);
        window.location.href = "jukebox://host?hostToken=" + hostToken + "&privateId=" + playlistPrivateId;
        return;
    }
});