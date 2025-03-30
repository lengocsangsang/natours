// THIS IS TO MAKE API CALL TO MAPBOX

/*eslint-disable*/

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibG5zYW5nIiwiYSI6ImNtOGU4czNtNjJrYm4ycnIzczYxbTFib2IifQ.v0DAlTSuQGAsQjip_CwxjA';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/lnsang/cm8eaqfu600t701sa04oihgh2',
    scrollZoom: false,
    // center: [-118.113491, 34.111745], // starting position [lng, lat]. Note that lat must be set between -90 and 90
    // zoom: 4,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // CREATE MARKER
    const el = document.createElement('div');
    el.className = 'marker';

    // ADD A MARKER
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // ADD POPUP
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // EXTENDS MAP BOUND TO INCLUDE CURRENT LOCATION
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100,
    },
  });
};
