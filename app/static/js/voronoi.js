const VATIKA_LABEL_ZOOM = 12;

let vatikaLegend = null;
let cspLegendData = [];
let showVatikaLegend = false;

/* =========================
   VATIKA LABELS
========================= */

function updateVatikaLabels() {

  if (!voronoiLayer || !map) return;

  const showLabels =
    map.getZoom() >= VATIKA_LABEL_ZOOM;

  voronoiLayer.eachLayer(
    function (layer) {

      const tooltip =
        layer.getTooltip();

      if (!tooltip) return;

      if (showLabels) {
        layer.openTooltip();
      } else {
        layer.closeTooltip();
      }

    }
  );
}


/* =========================
   VATIKA LEGEND
========================= */

function addVatikaLegend() {

  if (vatikaLegend || !map) return;

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
        <div id="vatika-summary">

          <div class="legend-title">
            Vatika Types
          </div>

          <div class="legend-item">
            <span class="legend-color active"></span>
            Active Vatika's
          </div>

          <div class="legend-item">
            <span class="legend-color virtual"></span>
            Virtual Vatika's
          </div>

        </div>

        <div id="csp-summary"
             style="display: none;">
        </div>
      `;

      return div;
    };

  vatikaLegend.addTo(map);

  /*
     Apply current Vatika visibility.
  */
  updateVatikaLegendVisibility(
    showVatikaLegend
  );

  /*
     Re-apply CSP data if it already exists.
  */
  updateCSPLegend(cspLegendData);
}

/* =========================
   TOGGLE VATIKA LEGEND
========================= */

function updateVatikaLegendVisibility(show) {

  showVatikaLegend = show;

  if (!vatikaLegend || !map) {
    return;
  }

  const vatikaSummary =
    document.getElementById("vatika-summary");

  if (!vatikaSummary) {
    return;
  }

  vatikaSummary.style.display =
    show ? "block" : "none";
}

/* =========================
   UPDATE CSP LEGEND
========================= */

function updateCSPLegend(data) {

  /*
     Always store the latest CSP data.
  */
  cspLegendData =
    Array.isArray(data) ? data : [];


  /* =========================
     NO CSP DATA
  ========================= */

  if (cspLegendData.length === 0) {

    if (vatikaLegend && map) {

      const cspSummary =
        document.getElementById(
          "csp-summary"
        );

      if (cspSummary) {
        cspSummary.innerHTML = "";
        cspSummary.style.display = "none";
      }
    }

    return;
  }


  /* =========================
     CREATE LEGEND IF NEEDED
  ========================= */

  if (!vatikaLegend && map) {
    addVatikaLegend();
  }


  if (!vatikaLegend || !map) {
    return;
  }


  const cspSummary =
    document.getElementById(
      "csp-summary"
    );

  if (!cspSummary) {
    return;
  }


  /* =========================
     CALCULATE BLOCK COUNTS
  ========================= */

  const blockCounts = {};

  cspLegendData.forEach(function (csp) {

    const blockName =
      csp.block_name ||
      "Unknown Block";

    if (!blockCounts[blockName]) {
      blockCounts[blockName] = 0;
    }

    blockCounts[blockName]++;
  });


  /* =========================
     BUILD CSP SUMMARY
  ========================= */

  let html = `
    <div class="legend-divider"></div>

    <div class="legend-title">
      CSP Summary
    </div>

    <div class="legend-item">
      <b>Total CSPs:</b>&nbsp;
      ${cspLegendData.length}
    </div>
  `;


  Object.keys(blockCounts)
    .sort()
    .forEach(function (blockName) {

      html += `
        <div class="legend-item">
          ${blockName}: ${blockCounts[blockName]}
        </div>
      `;
    });


  cspSummary.innerHTML = html;
  cspSummary.style.display = "block";
}

/* =========================
   REMOVE VATIKA LEGEND
========================= */

function removeVatikaLegend() {

  if (vatikaLegend && map) {

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
  geojson,
  physicalOnly = false
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

    /*
       No Voronoi means no Vatika section.
       CSP legend can still be displayed.
    */
    updateVatikaLegendVisibility(false);

    /*
       If CSP data has already arrived,
       make sure the CSP legend is displayed.
    */
    if (cspLegendData.length > 0) {
        updateCSPLegend(cspLegendData);
    }

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
     NORMAL VATIKA BOUNDARY
     
     In Physical Vatika mode
     we hide the overall boundary.
  ========================= */

  if (!physicalOnly) {

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

  }


  /* =========================
     VORONOI LAYER
  ========================= */

  voronoiLayer =
    L.geoJSON(
      polygonFeatures,
      {

        style:
          function (feature) {

            const isPhysical =
              Number(
                feature.properties.is_physical
              ) === 1;


            /*
              PHYSICAL VATIKA MODE

              Physical:
                Green / visible

              Virtual:
                Completely transparent
            */

            if (physicalOnly) {

              if (isPhysical) {

                return {
                  color: "#1D9E75",
                  weight: 2,
                  opacity: 1,
                  fillColor: "#1D9E75",
                  fillOpacity: 0.35
                };

              }

              return {
                color: "transparent",
                weight: 0,
                opacity: 0,
                fillColor: "transparent",
                fillOpacity: 0
              };

            }


            /*
              NORMAL VATIKA MODE

              Existing behavior:
                Physical = Green
                Virtual  = Orange
            */

            return {

              color:
                isPhysical
                  ? "#1D9E75"
                  : "#ff7800",

              weight: 2,

              fillColor:
                isPhysical
                  ? "#1D9E75"
                  : "#ff7800",

              fillOpacity: 0.35

            };

          },


        onEachFeature:
  function (
    feature,
    layer
  ) {

    const isPhysical =
      Number(
        feature.properties.is_physical
      ) === 1;

    /*
      Physical Vatika mode:
      Hidden virtual Vatika polygons
      should not be clickable or show
      popup/labels.
    */
    if (
      physicalOnly &&
      !isPhysical
    ) {
      layer.options.interactive = false;
      return;
    }

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
     MAP BOUNDS
     
     Normal Vatika:
       Existing behavior

     Physical Vatika:
       Fit only around physical
       features.
  ========================= */

  if (physicalOnly) {

    const physicalFeatures =
      polygonFeatures.filter(
        feature =>
          Number(
            feature.properties.is_physical
          ) === 1
      );

    if (
      physicalFeatures.length > 0
    ) {

      const physicalBounds =
        L.geoJSON(
          physicalFeatures
        ).getBounds();

      if (
        physicalBounds.isValid()
      ) {

        map.fitBounds(
          physicalBounds
        );

      }

    }

  } else {

    if (
      voronoiLayer.getBounds().isValid()
    ) {

      map.fitBounds(
        voronoiLayer.getBounds()
      );

    }

  }


  /* =========================
     LEGEND
  ========================= */

  showVatikaLegend = true;

addVatikaLegend();

updateVatikaLegendVisibility(true);

updateVatikaLabels();

}


/* =========================
   LOAD VORONOI
========================= */

async function loadVoronoi(
  blockCodes,
  physicalOnly = false
) {

  try {

    if (!blockCodes) return;

    const res =
      await fetch(
        `/geo/voronoi?block_codes=${blockCodes}`
      );

    const geojson =
      await res.json();

    console.log(
      "Voronoi GeoJSON:",
      geojson
    );

    renderVoronoiLayer(
      geojson,
      physicalOnly
    );

  } catch (error) {

    console.error(
      "Voronoi API Error:",
      error
    );

  }
}


/* =========================
   MAP ZOOM HANDLER
========================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const waitForMap =
      setInterval(
        function () {

          if (
            typeof map !== "undefined" &&
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