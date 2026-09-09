
/* =========================
   GLOBAL MULTI BLOCK STATE
========================= */

let selectedBlocks = [];


/* =========================
   RENDER TERRITORIES
========================= */

function renderTerritories(
  data,
  showBlock = false
) {

  const container =
    document.getElementById(
      "territoryContainer"
    );

  const header =
    document.getElementById(
      "territoryHeader"
    );

  const empty =
    document.getElementById(
      "emptyState"
    );

  container.innerHTML = "";

  if (!data || data.length === 0) {

    empty.innerText =
      "No Territory found for selected State";

    empty.style.display = "block";

    return;
  }

  empty.style.display = "none";

  if (showBlock) {

    header.style.gridTemplateColumns =
      "1fr 2fr 2fr 2fr";

    header.innerHTML = `
      <div>State</div>
      <div>Territory</div>
      <div>District</div>
      <div>Block</div>
    `;

  } else {

    header.style.gridTemplateColumns =
      "1fr 2fr";

    header.innerHTML = `
      <div>State</div>
      <div>Territory</div>
    `;
  }

  data.forEach(t => {

    const row =
      document.createElement("div");

    row.className =
      "territory-row";

    if (showBlock) {

      row.style.gridTemplateColumns =
        "1fr 2fr 2fr 2fr";

      row.innerHTML = `
        <div>${t.state || "-"}</div>
        <div>${t.name || "-"}</div>
        <div>${t.district || "-"}</div>
        <div>${t.block || "-"}</div>
      `;

    } else {

      row.style.gridTemplateColumns =
        "1fr 2fr";

      row.innerHTML = `
        <div>${t.state || "-"}</div>
        <div>${t.name || "-"}</div>
      `;
    }

    container.appendChild(row);
  });
}


/* =========================
   RENDER BLOCKS
========================= */

function renderBlocks(data) {

  const container =
    document.getElementById(
      "territoryContainer"
    );

  const header =
    document.getElementById(
      "territoryHeader"
    );

  const empty =
    document.getElementById(
      "emptyState"
    );

  container.innerHTML = "";

  if (!data || data.length === 0) {

    empty.style.display = "block";

    return;
  }

  empty.style.display = "none";

  header.style.gridTemplateColumns =
    "1fr 2fr 1fr";

  header.innerHTML = `
    <div>Block Code</div>
    <div>Block Name</div>
    <div>Population</div>
  `;

  data.forEach(b => {

    const row =
      document.createElement("div");

    row.className =
      "territory-row";

    row.style.gridTemplateColumns =
      "1fr 2fr 1fr";

    row.innerHTML = `
      <div>${b.block_code || "-"}</div>
      <div>${b.block_name || "-"}</div>
      <div>${b.population || "-"}</div>
    `;

    container.appendChild(row);
  });
}


/* =========================
   RENDER VILLAGES
========================= */

function renderVillages(data) {

  const container =
    document.getElementById(
      "territoryContainer"
    );

  const header =
    document.getElementById(
      "territoryHeader"
    );

  const empty =
    document.getElementById(
      "emptyState"
    );

  container.innerHTML = "";

  if (!data || data.length === 0) {

    empty.innerText =
      "No Villages found for selected Block(s)";

    empty.style.display = "block";

    return;
  }

  empty.style.display = "none";

  header.style.gridTemplateColumns =
    "1fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr";

  header.innerHTML = `
    <div>Block</div>
    <div>Village Name</div>
    <div>Population</div>
    <div>Males</div>
    <div>Females</div>
    <div>Households</div>
    <div>Main Crop</div>
  `;

  data.forEach(v => {

    const row =
      document.createElement("div");

    row.className =
      "territory-row";

    row.style.gridTemplateColumns =
      "1fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr";

    row.innerHTML = `
      <div>${v.block_name || "-"}</div>
      <div>${v.village_name || "-"}</div>
      <div>${v.population || "-"}</div>
      <div>${v.male_population || "-"}</div>
      <div>${v.female_population || "-"}</div>
      <div>${v.houses || "-"}</div>
      <div>${v.main_crop || "-"}</div>
    `;

    container.appendChild(row);
  });
}


/* =========================
   RENDER VATIKAS
========================= */

function renderVatikas(
  data,
  physicalOnly = false
) {

  const container =
    document.getElementById(
      "territoryContainer"
    );

  const header =
    document.getElementById(
      "territoryHeader"
    );

  const empty =
    document.getElementById(
      "emptyState"
    );

  container.innerHTML = "";

  /*
    Physical Vatika mode:
    Show only records where
    is_physical = 1
  */
  const displayData = physicalOnly
    ? (data || []).filter(
      v => Number(v.is_physical) === 1
    )
    : data;

  if (
    !displayData ||
    displayData.length === 0
  ) {

    empty.innerText =
      physicalOnly
        ? "No Physical Vatikas found for selected Block(s)"
        : "No Vatikas found for selected Block(s)";

    empty.style.display =
      "block";

    return;
  }

  empty.style.display =
    "none";

  header.style.gridTemplateColumns =
    "1fr 1fr 2fr 2fr 1fr";

  header.innerHTML = `

    <div>Block</div>
    <div>Vatika Code</div>
    <div>Vatika Name</div>
    <div>Village Name</div>
    <div>Households</div>

  `;

  displayData.forEach(v => {

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "territory-row";

    row.style.gridTemplateColumns =
      "1fr 1fr 2fr 2fr 1fr";

    row.innerHTML = `

      <div>
        ${v.block_name || "-"}
      </div>

      <div>
        ${v.vatika_code || "-"}
      </div>

      <div>
        ${v.vatika_name || "-"}
      </div>

      <div>
        ${v.village_name || "-"}
      </div>

      <div>
        ${v.households || "-"}
      </div>

    `;

    container.appendChild(
      row
    );

  });
}
/* =========================
   ROUTE VISIT / COORDINATES MODAL
========================= */

function showCoordinatesUnavailableModal() {

  const modal =
    document.getElementById(
      "coordinatesModal"
    );

  if (!modal) return;

  modal.classList.add(
    "active"
  );
}


function closeCoordinatesUnavailableModal() {

  const modal =
    document.getElementById(
      "coordinatesModal"
    );

  if (!modal) return;

  modal.classList.remove(
    "active"
  );
}


function visitRoute(
  googleMapsLink
) {

  const link =
    typeof googleMapsLink === "string"
      ? googleMapsLink.trim()
      : "";

  if (link) {

    window.open(
      link,
      "_blank",
      "noopener,noreferrer"
    );

    return;
  }

  showCoordinatesUnavailableModal();
}

/* =========================
   RENDER ROUTES
========================= */

function renderRoutes(data) {

  const container =
    document.getElementById(
      "territoryContainer"
    );

  const header =
    document.getElementById(
      "territoryHeader"
    );

  const empty =
    document.getElementById(
      "emptyState"
    );

  container.innerHTML = "";

  if (!data || data.length === 0) {

    empty.innerText =
      "No Routes found for selected Block(s)";

    empty.style.display = "block";

    return;
  }
  empty.style.display = "none";

  header.style.gridTemplateColumns =
    "1fr 1fr 2fr 2fr 1fr 1fr";

  header.innerHTML = `

    <div>Block</div>
    <div>Route Code</div>
    <div>Route Name</div>
    <div>Village</div>
    <div>HH</div>
    <div>Visit</div>

  `;

  data.forEach(r => {

    const row =
      document.createElement("div");

    row.className =
      "territory-row";

    row.style.gridTemplateColumns =
      "1fr 1fr 2fr 2fr 1fr 1fr";

    row.innerHTML = `
  <div>${r.block_name || "-"}</div>
  <div>${r.route_code || "-"}</div>
  <div>${r.route_name || "-"}</div>
  <div>${r.route_village || "-"}</div>
  <div>${r.village_hh || "-"}</div>
  <div>
    <button type="button" class="visit-btn">
      Visit
    </button>
  </div>
`;

    const visitButton = row.querySelector(".visit-btn");

    visitButton.addEventListener("click", function () {
      visitRoute(r.google_maps_link);
    });

    container.appendChild(row);
  });
}

/* =========================
   RENDER PHYSICAL ROUTES
========================= */

function renderPhysicalRoutes(data) {

  const container =
    document.getElementById(
      "territoryContainer"
    );

  const header =
    document.getElementById(
      "territoryHeader"
    );

  const empty =
    document.getElementById(
      "emptyState"
    );

  container.innerHTML = "";


  if (
    !data ||
    data.length === 0
  ) {

    empty.innerText =
      "No Physical Routes found for selected Block(s)";

    empty.style.display =
      "block";

    return;
  }


  empty.style.display =
    "none";


  header.style.gridTemplateColumns =
    "1fr 1fr 2fr 2fr 1fr 1fr";


  header.innerHTML = `

    <div>Block</div>

    <div>Route Code</div>

    <div>Route Name</div>

    <div>Village</div>

    <div>HH</div>

    <div>Visit</div>

  `;


  data.forEach(r => {

    const row =
      document.createElement(
        "div"
      );


    row.className =
      "territory-row";


    row.style.gridTemplateColumns =
      "1fr 1fr 2fr 2fr 1fr 1fr";


    row.innerHTML = `

  <div>
    ${r.block_name || "-"}
  </div>

  <div>
    ${r.route_code || "-"}
  </div>

  <div>
    ${r.route_name || "-"}
  </div>

  <div>
    ${r.route_village || "-"}
  </div>

  <div>
    ${r.village_hh || "-"}
  </div>

  <div>
    <button
      type="button"
      class="visit-btn"
    >
      Visit
    </button>
  </div>

`;

    const visitButton =
      row.querySelector(".visit-btn");

    visitButton.addEventListener(
      "click",
      function () {
        visitRoute(r.google_maps_link);
      }
    );


    container.appendChild(
      row
    );

  });
}

/* =========================
   MULTI BLOCK PANEL
========================= */

function toggleMultiBlockPanel(
  event
) {

  event.stopPropagation();

  const panel =
    document.getElementById(
      "multiBlockPanel"
    );

  panel.classList.toggle(
    "active"
  );
}


/* =========================
   RENDER MULTI BLOCKS
========================= */

function renderMultiBlockOptions(
  data
) {

  const container =
    document.getElementById(
      "multiBlockList"
    );

  container.innerHTML = "";

  data.forEach(block => {

    const item =
      document.createElement("div");

    item.className =
      "multi-block-item";

    item.innerHTML = `

      <input
        type="checkbox"
        value="${block.block_code}"
        data-name="${block.block_name}"
        data-lat="${block.lat}"
        data-lng="${block.lng}"
      >

      <label>
        ${block.block_name}
      </label>

    `;

    const checkbox =
      item.querySelector(
        'input[type="checkbox"]'
      );

    item.addEventListener(
      "click",

      function (e) {

        if (
          e.target.tagName !==
          "INPUT"
        ) {

          checkbox.checked =
            !checkbox.checked;
        }

        item.classList.toggle(
          "selected",
          checkbox.checked
        );
      }
    );

    checkbox.addEventListener(
      "change",

      function () {

        item.classList.toggle(
          "selected",
          checkbox.checked
        );
      }
    );

    container.appendChild(item);
  });
}


/* =========================
   APPLY MULTI BLOCKS
========================= */

function applyMultiBlockSelection() {

  const checked =
    document.querySelectorAll(
      '#multiBlockList input[type="checkbox"]:checked'
    );

  selectedBlocks = [];

  checked.forEach(cb => {

    selectedBlocks.push(
      parseInt(cb.value)
    );
  });

  console.log(
    "Selected Blocks:",
    selectedBlocks
  );

  const btn =
    document.getElementById(
      "multiBlockBtn"
    );

  btn.innerText =
    `Blocks (${selectedBlocks.length})`;
  const wrapper =
    document.querySelector(
      ".multi-block-wrapper"
    );

  wrapper.style.width =
    (btn.scrollWidth + 20) + "px";

  document
    .getElementById(
      "multiBlockPanel"
    )
    .classList.remove(
      "active"
    );

  const blockCodes =
    selectedBlocks.join(",");

  console.log(
    "Block Codes String:",
    blockCodes
  );

  loadVillages(
    blockCodes
  );

  updateMapByMultiBlocks();

  clearVoronoiLayer();

  clearVatikaBoundary();

  clearRouteLayer();

  clearPhysicalRouteLayer();

  document.getElementById(
    "viewType"
  ).value = "";
}


/* =========================
   DISTRICT CHANGE
========================= */

function handleDistrictChange(
  dropdown
) {

  const distCode =
    dropdown.value;

  if (!distCode) return;

  loadBlocks(distCode);

  const selectedOption =
    dropdown.options[
    dropdown.selectedIndex
    ];

  const lat =
    selectedOption.dataset.lat;

  const lng =
    selectedOption.dataset.lng;

  if (
    lat &&
    lng &&
    parseFloat(lat) !== 0 &&
    parseFloat(lng) !== 0
  ) {

    updateMapByDistrict(
      lat,
      lng
    );
  }
}


/* =========================
   LOAD BLOCKS
========================= */

async function loadBlocks(
  distCode
) {

  try {

    if (!distCode) return;

    const res = await fetch(
      `/geo/blocks?dist_code=${distCode}`
    );

    const data =
      await res.json();

    console.log(
      "Blocks:",
      data
    );

    renderBlocks(
      data
    );

    renderMultiBlockOptions(
      data
    );

  } catch (error) {

    console.error(
      "Blocks API Error:",
      error
    );
  }
}


/* =========================
   LOAD VILLAGES
========================= */

async function loadVillages(
  blockCodes
) {

  try {

    if (!blockCodes) return;

    const res = await fetch(
      `/geo/villages?block_codes=${blockCodes}`
    );

    const data =
      await res.json();

    console.log(
      "Villages:",
      data
    );

    renderVillages(
      data
    );

  } catch (error) {

    console.error(
      "Villages API Error:",
      error
    );
  }
}


/* =========================
   RESET FILTERS
========================= */

function resetFilters() {

  document.getElementById(
    "state"
  ).value = "";

  document.getElementById(
    "district"
  ).innerHTML =
    `<option value="">Select District</option>`;

  document.getElementById(
    "viewType"
  ).value = "";

  selectedBlocks = [];

  document
    .querySelectorAll(
      '#multiBlockList input[type="checkbox"]'
    )
    .forEach(cb => {

      cb.checked = false;

      cb.closest(
        ".multi-block-item"
      )?.classList.remove(
        "selected"
      );
    });

  document.getElementById(
    "multiBlockBtn"
  ).innerText =
    "Select Blocks";

  document.querySelector(
    ".multi-block-wrapper"
  ).style.width =
    "180px";

  document
    .getElementById(
      "multiBlockPanel"
    )
    .classList.remove(
      "active"
    );

  document.getElementById(
    "multiBlockList"
  ).innerHTML = "";

  resetMap();

  loadTerritories();
}


/* =========================
   INIT
========================= */

document.addEventListener(
  "DOMContentLoaded",

  async function () {

    await loadStates();

    await loadTerritories();

    /* =========================
       STATE CHANGE
    ========================= */

    document.getElementById(
      "state"
    ).addEventListener(

      "change",

      function () {

        const selectedOption =
          this.options[
          this.selectedIndex
          ];

        const stateCode =
          this.value;

        const lat =
          selectedOption.dataset.lat;

        const lng =
          selectedOption.dataset.lng;

        if (stateCode) {
          clearRouteLayer();

          clearPhysicalRouteLayer();

          clearVoronoiLayer();

          clearVatikaBoundary();

          clearMultiBlockLayer();

          updateMapByState(
            lat,
            lng
          );

          loadTerritories(
            stateCode
          );

          document.getElementById(
            "district"
          ).innerHTML =
            `<option value="">Select District</option>`;

          document.getElementById(
            "viewType"
          ).value = "";

          loadDistricts(
            stateCode
          );

        } else {

          resetMap();

          loadTerritories();
        }

      }

    );

    /* =========================
       MULTI BLOCK BUTTON
    ========================= */

    document
      .getElementById(
        "multiBlockBtn"
      )
      .addEventListener(

        "click",

        function (event) {

          toggleMultiBlockPanel(
            event
          );
        }
      );

    /* =========================
       CLOSE DROPDOWN
    ========================= */

    document.addEventListener(

      "click",

      function (event) {

        const wrapper =
          document.querySelector(
            ".multi-block-wrapper"
          );

        const panel =
          document.getElementById(
            "multiBlockPanel"
          );

        if (
          wrapper &&
          !wrapper.contains(
            event.target
          )
        ) {

          panel.classList.remove(
            "active"
          );
        }
      }
    );

    /* =========================
       APPLY BLOCKS
    ========================= */

    document
      .getElementById(
        "applyMultiBlocks"
      )
      .addEventListener(
        "click",
        applyMultiBlockSelection
      );

    /* =========================
     VIEW TYPE CHANGE
  ========================= */

    document.getElementById(
      "viewType"
    ).addEventListener(

      "change",

      function () {

        const viewType =
          this.value;


        /* =========================
           NO BLOCKS SELECTED
        ========================= */

        if (
          selectedBlocks.length === 0
        ) {

          clearVoronoiLayer();

          clearVatikaBoundary();

          clearRouteLayer();

          clearPhysicalRouteLayer();

          return;
        }


        /* =========================
   VATIKA MODE
========================= */

        if (
          viewType &&
          viewType.toLowerCase() ===
          "vatika"
        ) {

          clearRouteLayer();

          clearPhysicalRouteLayer();

          clearBlockMarker();

          const blockCodes =
            selectedBlocks.join(",");

          console.log(
            "Voronoi Block Codes:",
            blockCodes
          );

          clearMultiBlockLayer();

          loadVoronoi(
            blockCodes,
            false
          );

          loadVatikas(
            blockCodes,
            false
          );

          return;
        }

        /* =========================
   PHYSICAL VATIKA MODE
========================= */

if (
  viewType &&
  viewType.toLowerCase() ===
  "physical_vatika"
) {

  clearRouteLayer();

  clearPhysicalRouteLayer();

  clearBlockMarker();

  const blockCodes =
    selectedBlocks.join(",");

  console.log(
    "Physical Vatika Block Codes:",
    blockCodes
  );

  clearMultiBlockLayer();

  /*
    Load the complete Voronoi GeoJSON,
    but render only physical Vatikas.
  */
  loadVoronoi(
    blockCodes,
    true
  );

  /*
    Load Vatika data and show only
    is_physical = 1 records in table.
  */
  loadVatikas(
    blockCodes,
    true
  );

  return;
}


     
        /* =========================
           ROUTES MODE
        ========================= */

        if (
      viewType &&
      viewType.toLowerCase() ===
      "routes"
    ) {

      clearVoronoiLayer();

      clearVatikaBoundary();

      clearPhysicalRouteLayer();

      clearMultiBlockLayer();


      const blockCodes =
        selectedBlocks.join(",");


      console.log(
        "Route Block Codes:",
        blockCodes
      );


      clearRouteLayer();


      loadRoutes(
        blockCodes
      );

      loadRouteGeoJSON(
        blockCodes
      );


      return;
    }


    /* =========================
       PHYSICAL ROUTES MODE
    ========================= */

    if (
      viewType &&
      viewType.toLowerCase() ===
      "physical_routes"
    ) {

      clearVoronoiLayer();

      clearVatikaBoundary();

      clearRouteLayer();

      clearMultiBlockLayer();


      const blockCodes =
        selectedBlocks.join(",");


      console.log(
        "Physical Route Block Codes:",
        blockCodes
      );


      loadPhysicalRoutes(
        blockCodes
      );

      loadPhysicalRouteGeoJSON(
        blockCodes
      );


      return;
    }


    /* =========================
       DEFAULT
    ========================= */

    clearVoronoiLayer();

    clearVatikaBoundary();

    clearRouteLayer();

    clearPhysicalRouteLayer();

  }

);

/* =========================
COORDINATES MODAL
========================= */

const coordinatesModal =
  document.getElementById(
    "coordinatesModal"
  );

const coordinatesModalClose =
  document.getElementById(
    "coordinatesModalClose"
  );

const coordinatesModalOk =
  document.getElementById(
    "coordinatesModalOk"
  );


if (coordinatesModalClose) {

  coordinatesModalClose.addEventListener(
    "click",
    closeCoordinatesUnavailableModal
  );

}


if (coordinatesModalOk) {

  coordinatesModalOk.addEventListener(
    "click",
    closeCoordinatesUnavailableModal
  );

}


if (coordinatesModal) {

  coordinatesModal.addEventListener(
    "click",
    function (event) {

      if (
        event.target ===
        coordinatesModal
      ) {

        closeCoordinatesUnavailableModal();

      }

    }
  );

}


document.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key === "Escape"
    ) {

      closeCoordinatesUnavailableModal();

    }

  }
);

  });