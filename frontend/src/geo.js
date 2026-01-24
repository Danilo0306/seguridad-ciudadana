navigator.geolocation.getCurrentPosition(
  (pos) => {
    console.log("Lat:", pos.coords.latitude, "Lon:", pos.coords.longitude);
  },
  (err) => {
    console.error(err);
  }
);
