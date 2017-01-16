function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
};

function getDistanceFromLatLonInMiles(lat1,lon1,lat2,lon2) {
	return getDistanceFromLatLonInKm * 0.621371;
}

getCurrentCoordinates = function (positionFunc, errorFunc, notSupportedFunc) {
	if (navigator.geolocation)
    {
    	navigator.geolocation.getCurrentPosition(positionFunc, errorFunc);
    }
  	else
  	{
  		notSupportedFunc();
  	}
};

isWithinRadiusInMiles = function (latitude1, longitude, latitude2, longitude2, radiusMiles) {
	var distanceInMiles = getDistanceFromLatLonInMiles(latitude1, longitude1, latitude2, longitude2);
	return distanceInMiles < radiusMiles;
};
