
/* =========================
   LABEL  / LEGEND  SETTINGS
========================= */

const VATIKA_LABEL_ZOOM = 12;
let vatikaLegend = null;

/* =========================
   UPDATE LABEL VISIBILITY
========================= */

function updateVatikaLabels() {

  if (!voronoiLayer || !map) {
    return;
  }

  const showLabels =
    map.getZoom() >=
    VATIKA_LABEL_ZOOM;

  voronoiLayer.eachLayer(
    function (layer) {

      const tooltip =
        layer.getTooltip();

      if (!tooltip) {
        return;
      }

      if (showLabels) {

        layer.openTooltip();

      } else {

        layer.closeTooltip();
      }
    }
  );
}


/* =========================
   ADD VATIKA LEGEND
========================= */

function addVatikaLegend() {

  if (
    vatikaLegend ||
    !map
  ) {
    return;
  }

  vatikaLegend =
    L.control({
      position: "bottomright"
    });

  vatikaLegend.onAdd =
    function () {

      const div =
        L.DomUtil.create(
          "div",
          "vatika-legend"
        );

      div.innerHTML = `

        <div class="legend-title">
          Vatika Types
        </div>

        <div class="legend-item">

          <span
            class="legend-color active"
          ></span>

          Active Vatika's

        </div>

        <div class="legend-item">

          <span
            class="legend-color virtual"
          ></span>

          Virtual Vatika's

        </div>

      `;

      return div;
    };

  vatikaLegend.addTo(
    map
  );
}


/* =========================
   REMOVE VATIKA LEGEND
========================= */

function removeVatikaLegend() {

  if (
    vatikaLegend &&
    map
  ) {

    map.removeControl(
      vatikaLegend
    );

    vatikaLegend = null;
  }
}


/* =========================
   RENDER VORONOI
========================= */

function renderVoronoiLayer(
  geojson
) {

  clearVoronoiLayer();

  clearVatikaBoundary();

  if (
    !geojson ||
    !geojson.features ||
    geojson.features.length === 0
  ) {

    console.log(
      "No Voronoi polygons"
    );

    return;
  }

  /* =========================
     SEPARATE FEATURES
  ========================= */

  const polygonFeatures =
    geojson.features.filter(
      f =>
        !f.properties.feature_type
    );

  const boundaryFeatures =
    geojson.features.filter(
      f =>
        f.properties.feature_type ===
        "boundary"
    );

  /* =========================
     RENDER OPERATIONAL BOUNDARY
  ========================= */

  vatikaBoundaryLayer =
    L.geoJSON(
      boundaryFeatures,
      {

        style: {

          color: "#004d40",

          weight: 4,

          fillOpacity: 0,

          dashArray: "8 6"
        }

      }

    ).addTo(map);

  /* =========================
     RENDER VORONOI POLYGONS
  ========================= */

  voronoiLayer = L.geoJSON(

    polygonFeatures,

    {

      style: function (
        feature
      ) {

        const isPhysical =
          feature.properties.is_physical;

        return {

          color:
            isPhysical === 1
              ? "#1D9E75"
              : "#ff7800",

          weight: 2,

          fillColor:
            isPhysical === 1
              ? "#1D9E75"
              : "#ff7800",

          fillOpacity: 0.35
        };
      },

      onEachFeature: function (
        feature,
        layer
      ) {

        /* =========================
           POPUP
        ========================= */

        layer.bindPopup(`

          <b>Vatika:</b>
          ${feature.properties.vatika_name}

          <br>

          <b>Village:</b>
          ${feature.properties.village_name}

          <br>

          <b>Households:</b>
          ${feature.properties.households}

        `);

        /* =========================
           VATIKA LABEL
        ========================= */

        if (
          feature.properties.vatika_name
        ) {

          layer.bindTooltip(

            feature.properties.vatika_name,

            {

              permanent: true,

              direction: "center",

              className:
                "vatika-label"

            }

          );
        }
      }

    }

  ).addTo(map);

  /* =========================
     FIT MAP
  ========================= */

  map.fitBounds(
    voronoiLayer.getBounds()
  );

  /* =========================
     INITIAL LABEL STATE
  ========================= */
  addVatikaLegend();
  updateVatikaLabels();
}


/* =========================
   LOAD VORONOI
========================= */

async function loadVoronoi(
  blockCodes
) {

  try {

    if (!blockCodes) return;

    const res = await fetch(

      `/geo/voronoi?block_codes=${blockCodes}`

    );

    const geojson =
      await res.json();

    console.log(
      "Voronoi GeoJSON:",
      geojson
    );

    renderVoronoiLayer(
      geojson
    );

  } catch (error) {

    console.error(
      "Voronoi API Error:",
      error
    );
  }
}


/* =========================
   MAP ZOOM EVENT
========================= */

document.addEventListener(
  "DOMContentLoaded",

  function () {

    const waitForMap =
      setInterval(

        function () {

          if (
            typeof map !==
            "undefined" &&
            map
          ) {

            clearInterval(
              waitForMap
            );

            map.on(

              "zoomend",

              function () {

                updateVatikaLabels();
              }

            );
          }

        },

        250

      );
  }
);

