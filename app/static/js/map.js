/* =========================
   GLOBAL VARIABLES
========================= */

let stateMarker = null;
let districtMarker = null;
let blockMarker = null;

let voronoiLayer = null;
let vatikaBoundaryLayer = null;
let multiBlockLayer = null;
let routeLayer = null;
let routeLegend = null;

let physicalRouteLayer = null;
let physicalRouteLegend = null;
/* =========================
   MAP UPDATE - STATE
========================= */

function updateMapByState(lat, lng) {

  if (!map || !lat || !lng) return;

  lat = parseFloat(lat);
  lng = parseFloat(lng);

  if (
    indiaLayer &&
    map.hasLayer(indiaLayer)
  ) {
    map.removeLayer(indiaLayer);
  }

  clearMapMarkers();

  map.setView([lat, lng], 6);

  stateMarker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup("Selected State")
    .openPopup();
}


/* =========================
   MAP UPDATE - DISTRICT
========================= */

function updateMapByDistrict(lat, lng) {

  if (!map || !lat || !lng) return;

  lat = parseFloat(lat);
  lng = parseFloat(lng);

  if (lat === 0 || lng === 0) return;

  clearMapMarkers();

  map.setView([lat, lng], 9);

  districtMarker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup("Selected District")
    .openPopup();
}



/* =========================
   MAP UPDATE - BLOCK
========================= */

function updateMapByBlock(lat, lng) {

  if (!map || !lat || !lng) return;

  lat = parseFloat(lat);
  lng = parseFloat(lng);

  if (lat === 0 || lng === 0) return;

  clearMapMarkers();

  map.setView([lat, lng], 11);

  blockMarker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup("Selected Block")
    .openPopup();
}



/* =========================
   CLEAR ALL MARKERS
========================= */

function clearMapMarkers() {

  if (
    stateMarker &&
    map.hasLayer(stateMarker)
  ) {

    map.removeLayer(stateMarker);

    stateMarker = null;
  }

  if (
    districtMarker &&
    map.hasLayer(districtMarker)
  ) {

    map.removeLayer(districtMarker);

    districtMarker = null;
  }

  if (
    blockMarker &&
    map.hasLayer(blockMarker)
  ) {

    map.removeLayer(blockMarker);

    blockMarker = null;
  }
}



/* =========================
   CLEAR BLOCK MARKER
========================= */

function clearBlockMarker() {

  if (
    blockMarker &&
    map.hasLayer(blockMarker)
  ) {

    map.removeLayer(blockMarker);

    blockMarker = null;
  }
}



/* =========================
   CLEAR VORONOI
========================= */

function clearVoronoiLayer() {

  if (
    voronoiLayer &&
    map.hasLayer(voronoiLayer)
  ) {

    map.removeLayer(voronoiLayer);

    voronoiLayer = null;
  }
  removeVatikaLegend();
}



/* =========================
   CLEAR VATIKA BOUNDARY
========================= */

function clearVatikaBoundary() {

  if (
    vatikaBoundaryLayer &&
    map.hasLayer(vatikaBoundaryLayer)
  ) {

    map.removeLayer(
      vatikaBoundaryLayer
    );

    vatikaBoundaryLayer = null;
  }
}

/* =========================
   CLEAR MULTI BLOCK LAYER
========================= */

function clearMultiBlockLayer() {

  if (
    multiBlockLayer &&
    map.hasLayer(
      multiBlockLayer
    )
  ) {

    map.removeLayer(
      multiBlockLayer
    );

    multiBlockLayer = null;
  }
}
/* =========================
   CLEAR ROUTES
========================= */

function clearRouteLayer() {

  if (
    routeLayer &&
    map.hasLayer(routeLayer)
  ) {

    map.removeLayer(
      routeLayer
    );

    routeLayer = null;
  }

  if (
    routeLegend
  ) {

    map.removeControl(
      routeLegend
    );

    routeLegend = null;
  }
}

/* =========================
   CLEAR PHYSICAL ROUTES
========================= */

function clearPhysicalRouteLayer() {

  if (
    physicalRouteLayer &&
    map.hasLayer(physicalRouteLayer)
  ) {
    map.removeLayer(
      physicalRouteLayer
    );

    physicalRouteLayer = null;
  }

  if (
    physicalRouteLegend
  ) {
    map.removeControl(
      physicalRouteLegend
    );

    physicalRouteLegend = null;
  }
}
/* =========================
   RESET MAP
========================= */

function resetMap() {

  clearMapMarkers();

  clearVoronoiLayer();

  clearVatikaBoundary();

  clearMultiBlockLayer();

  clearRouteLayer();

  clearPhysicalRouteLayer();

  if (
    indiaLayer &&
    !map.hasLayer(indiaLayer)
  ) {
    indiaLayer.addTo(map);
  }

  if (indiaLayer) {

    map.fitBounds(
      indiaLayer.getBounds()
    );
  }
}

/* =========================
   UPDATE MAP MULTI BLOCKS
========================= */

function updateMapByMultiBlocks() {
clearMapMarkers();

clearVoronoiLayer();

clearVatikaBoundary();

clearRouteLayer();

clearPhysicalRouteLayer();

clearMultiBlockLayer();

  const checked =
    document.querySelectorAll(
      '#multiBlockList input[type="checkbox"]:checked'
    );

  if (
    !checked ||
    checked.length === 0
  ) {

    console.log(
      "No blocks selected"
    );

    return;
  }

  /* =========================
     CREATE FEATURE GROUP
  ========================= */

  multiBlockLayer =
    L.featureGroup();

  checked.forEach(cb => {

    const lat =
      parseFloat(
        cb.dataset.lat
      );

    const lng =
      parseFloat(
        cb.dataset.lng
      );

    const blockName =
      cb.dataset.name;

    console.log(
      "Marker:",
      blockName,
      lat,
      lng
    );

    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat !== 0 &&
      lng !== 0
    ) {

      const marker =
        L.circleMarker(

          [lat, lng],

          {
            radius: 50,

            color: "#FFA13D",

            fillColor: "#FFA13D",

            fillOpacity: 0.75,

            weight: 1
          }

        ).bindPopup(
          `<b>${blockName}</b>`
        );

      multiBlockLayer.addLayer(
        marker
      );
    }
  });

  /* =========================
     ADD TO MAP
  ========================= */

  multiBlockLayer.addTo(
    map
  );

  /* =========================
     FIT BOUNDS
  ========================= */

  if (
    multiBlockLayer.getLayers().length > 0
  ) {

    map.fitBounds(

      multiBlockLayer.getBounds(),

      {
        padding: [40, 40]
      }

    );
  }
}




console.log(
  "map.js loaded"
);

console.log(
  typeof updateMapByMultiBlocks
);