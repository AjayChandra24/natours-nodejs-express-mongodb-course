export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYWpheWNoYW5kcmEyMzE3IiwiYSI6ImNtZW9uNmw3aDFlbGIycm9jZ2NzeDNpNW4ifQ.tiGxORzjf6KICvkyFzixpg';
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/ajaychandra2317/cmeonwr4w016g01qw3k0gh551', // style URL
    scrollZoom: false,
    // center: [-118.113491, 34.111745], // starting position [lng, lat]
    // zoom: 4, // starting zoom
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    }).setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    }).setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    } 
  });
};
