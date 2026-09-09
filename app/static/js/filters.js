
/* =========================
   LOAD TERRITORIES
========================= */

async function loadTerritories(
  stateCode = null
) {

  let url =
    "/geo/territories";

  if (stateCode) {

    url +=
      `?state_code=${stateCode}`;
  }

  const res =
    await fetch(url);

  const data =
    await res.json();

  renderTerritories(
    data,
    !!stateCode
  );
}


/* =========================
   LOAD STATES
========================= */

async function loadStates() {

  const res =
    await fetch("/geo/states");

  const data =
    await res.json();

  const dropdown =
    document.getElementById(
      "state"
    );

  dropdown.innerHTML =
    `<option value="">Select State</option>`;

  data.forEach(s => {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      s.state_code;

    option.textContent =
      s.state_name;

    option.dataset.lat =
      s.lat;

    option.dataset.lng =
      s.lng;

    dropdown.appendChild(option);
  });
}


/* =========================
   LOAD DISTRICTS
========================= */

async function loadDistricts(
  stateCode
) {

  const dropdown =
    document.getElementById(
      "district"
    );

  dropdown.innerHTML =
    `<option value="">Select District</option>`;

  if (!stateCode) return;

  const res = await fetch(
    `/geo/districts?state_code=${stateCode}`
  );

  const data =
    await res.json();

  data.forEach(d => {

    const option =
      document.createElement(
        "option"
      );

    option.value =
      d.district_id;

    option.textContent =
      d.district_name;

    option.dataset.lat =
      d.lat;

    option.dataset.lng =
      d.lng;

    dropdown.appendChild(option);
  });
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
   LOAD VATIKAS
========================= */

async function loadVatikas(
  blockCodes,
  physicalOnly = false
) {
  try {

    if (!blockCodes) return;

    const res = await fetch(
      `/geo/vatikas?block_codes=${blockCodes}`
    );

    const data =
      await res.json();

    console.log(
      "Vatikas:",
      data
    );

    renderVatikas(
      data,
      physicalOnly
    );

  } catch (error) {

    console.error(
      "Vatika API Error:",
      error
    );

  }
}

/* =========================
   LOAD ROUTES
========================= */

async function loadRoutes(
  blockCodes
) {

  try {

    if (!blockCodes) return;

    const res = await fetch(

      `/geo/routes?block_codes=${blockCodes}`

    );

    const data =
      await res.json();

    console.log(
      "Routes:",
      data
    );

    renderRoutes(
      data
    );

  } catch (error) {

    console.error(
      "Routes API Error:",
      error
    );
  }
}

/* =========================
   LOAD PHYSICAL ROUTES
========================= */

async function loadPhysicalRoutes(
  blockCodes
) {

  try {

    if (!blockCodes) return;

    const res = await fetch(
      `/geo/physical_routes?block_codes=${blockCodes}`
    );

    const data =
      await res.json();

    console.log(
      "Physical Routes:",
      data
    );

    renderPhysicalRoutes(
      data
    );

  } catch (error) {

    console.error(
      "Physical Routes API Error:",
      error
    );

  }
}