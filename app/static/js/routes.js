/* =========================
   LOAD ROUTE GEOJSON
========================= */

async function loadRouteGeoJSON(
  blockCodes
) {

  try {

    if (!blockCodes) return;

    const res = await fetch(

      `/geo/routes_geojson?block_codes=${blockCodes}`

    );

    const geojson =
      await res.json();

    console.log(
      "Routes GeoJSON:",
      geojson
    );

    renderRouteLayer(
      geojson
    );

  } catch(error) {

    console.error(
      "Routes GeoJSON Error:",
      error
    );
  }
}


/* =========================
   RENDER ROUTES
========================= */

function renderRouteLayer(
  geojson
) {

  clearRouteLayer();

  if (
    !geojson ||
    !geojson.features ||
    geojson.features.length === 0
  ) {

    console.log(
      "No Route Features"
    );

    return;
  }

  routeLayer = L.geoJSON(

    geojson,

    {

      style: function(
        feature
      ) {

        return {

          color:
            feature.properties.color,

          weight:
            feature.properties[
              "stroke-width"
            ] || 3,

          opacity: 0.9
        };
      },

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

      onEachFeature:
        function(
          feature,
          layer
        ) {

          const p =
            feature.properties;

          if (
            feature.geometry.type ===
            "LineString"
          ) {

            layer.bindPopup(`

              <b>Route:</b>
              ${p.route_name || "-"}

              <br>

              <b>Code:</b>
              ${p.route_code || "-"}

              <br>

              <b>Block:</b>
              ${p.block_name || "-"}

            `);

          }

          if (
            feature.geometry.type ===
            "Point"
          ) {

            layer.bindPopup(`

              <b>Route:</b>
              ${p.route_name || "-"}

              <br>

              <b>Village:</b>
              ${p.route_village || "-"}

            `);

          }
        }
    }

  ).addTo(map);

  map.fitBounds(
    routeLayer.getBounds()
  );

  addRouteLegend(
    geojson.legend || []
  );
}


/* =========================
   ROUTE LEGEND
========================= */

function addRouteLegend(
  legendData
) {

  if (
    !legendData ||
    legendData.length === 0
  ) {

    return;
  }

  routeLegend =
    L.control({

      position:
        "bottomright"
    });

  routeLegend.onAdd =
    function() {

      const div =
        L.DomUtil.create(
          "div",
          "route-legend"
        );

      let html =

        `
        <div class="legend-title">
          Routes
        </div>
      `;

      legendData.forEach(
        item => {

          html += `

            <div class="legend-item">

              <span
                class="legend-color"
                style="
                  background:
                  ${item.color}
                "
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

  routeLegend.addTo(
    map
  );
}