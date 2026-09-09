/* =========================
   LOAD PHYSICAL ROUTE GEOJSON
========================= */

async function loadPhysicalRouteGeoJSON(
  blockCodes
) {

  try {

    if (!blockCodes) return;

    const res = await fetch(
      `/geo/physical_routes_geojson?block_codes=${blockCodes}`
    );

    if (!res.ok) {
      throw new Error(
        `Physical Routes GeoJSON API failed: ${res.status}`
      );
    }

    const geojson =
      await res.json();

    console.log(
      "Physical Routes GeoJSON:",
      geojson
    );

    renderPhysicalRouteLayer(
      geojson
    );

  } catch (error) {

    console.error(
      "Physical Routes GeoJSON Error:",
      error
    );

  }
}


/* =========================
   RENDER PHYSICAL ROUTES
========================= */

function renderPhysicalRouteLayer(
  geojson
) {

  clearPhysicalRouteLayer();

  if (
    !geojson ||
    !geojson.features ||
    geojson.features.length === 0
  ) {

    console.log(
      "No Physical Route Features"
    );

    return;
  }


  physicalRouteLayer =
    L.geoJSON(
      geojson,
      {

        /* =========================
           ROUTE LINE STYLE
        ========================= */

        style: function(feature) {

          return {
            color:
              feature.properties.color,

            weight:
              feature.properties["stroke-width"] || 3,

            opacity: 0.9
          };

        },


        /* =========================
           POINT STYLE
        ========================= */

        pointToLayer:
          function(
            feature,
            latlng
          ) {

            if (
              feature.geometry.type ===
              "Point"
            ) {

              return L.circleMarker(
                latlng,
                {

                  radius: 6,

                  color:
                    feature.properties.color,

                  fillColor:
                    feature.properties.color,

                  fillOpacity: 0.9,

                  weight: 1

                }
              );

            }

          },


        /* =========================
           POPUPS
        ========================= */

        onEachFeature:
          function(
            feature,
            layer
          ) {

            const p =
              feature.properties || {};


            /* =========================
               ROUTE LINE POPUP
            ========================= */

            if (
              feature.geometry.type ===
              "LineString"
            ) {

              layer.bindPopup(`
                <b>Physical Route:</b>
                ${p.route_name || "-"}

                <br>

                <b>Code:</b>
                ${p.route_code || "-"}

                <br>

                <b>Block:</b>
                ${p.block_name || "-"}
              `);

            }


            /* =========================
               VILLAGE POINT POPUP
            ========================= */

            if (
              feature.geometry.type ===
              "Point"
            ) {

              layer.bindPopup(`
                <b>Physical Route:</b>
                ${p.route_name || "-"}

                <br>

                <b>Village:</b>
                ${p.route_village || "-"}

                <br>

                <b>Block:</b>
                ${p.block_name || "-"}
              `);

            }

          }

      }
    ).addTo(map);


  /* =========================
     FIT MAP TO ROUTES
  ========================= */

  if (
    physicalRouteLayer.getLayers().length >
    0
  ) {

    map.fitBounds(
      physicalRouteLayer.getBounds()
    );

  }


  /* =========================
     ADD LEGEND
  ========================= */

  addPhysicalRouteLegend(
    geojson.legend || []
  );
}


/* =========================
   PHYSICAL ROUTE LEGEND
========================= */

function addPhysicalRouteLegend(
  legendData
) {

  if (
    !legendData ||
    legendData.length === 0
  ) {
    return;
  }


  physicalRouteLegend =
    L.control({
      position: "bottomright"
    });


  physicalRouteLegend.onAdd =
    function() {

      const div =
        L.DomUtil.create(
          "div",
          "route-legend"
        );


      let html =
        `<div class="legend-title">
          Physical Routes
        </div>`;


      legendData.forEach(
        item => {

          html += `
            <div class="legend-item">

              <span
                class="legend-color"
                style="background:${item.color}"
              ></span>

              ${item.route_name}

            </div>
          `;

        }
      );


      div.innerHTML =
        html;

      return div;

    };


  physicalRouteLegend.addTo(
    map
  );
}


console.log(
  "physical_routes.js loaded"
);