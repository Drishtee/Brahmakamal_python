/* =========================================================
   ROUTE MANAGEMENT
   ========================================================= */


/* =========================================================
   CONSTANTS
========================================================= */

const MIN_HOUSEHOLDS = 7500;
const MAX_HOUSEHOLDS = 10000;


/* =========================================================
   GLOBAL STATE
========================================================= */

let routeVillages = [];

let selectedVillageIds = new Set();

let isCreatingRoute = false;


/* =========================================================
   DOM READY
========================================================= */

/* =========================================================
   INITIALIZE ROUTE MANAGEMENT
========================================================= */

initializeRouteManagement();

/* =========================================================
   INITIALIZE
========================================================= */

async function initializeRouteManagement() {

    setupEventListeners();

    await loadRouteStates();

    updateCreateRouteButton();

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    /* ---------------------------------------------
       STATE CHANGE
    --------------------------------------------- */

    const stateDropdown =
        document.getElementById("routeState");

    if (stateDropdown) {

        stateDropdown.addEventListener(
            "change",
            handleRouteStateChange
        );

    }


    /* ---------------------------------------------
       DISTRICT CHANGE
    --------------------------------------------- */

    const districtDropdown =
        document.getElementById("routeDistrict");

    if (districtDropdown) {

        districtDropdown.addEventListener(
            "change",
            handleRouteDistrictChange
        );

    }


    /* ---------------------------------------------
       BLOCK CHANGE
    --------------------------------------------- */

    const blockDropdown =
        document.getElementById("routeBlock");

    if (blockDropdown) {

        blockDropdown.addEventListener(
            "change",
            handleRouteBlockChange
        );

    }


    /* ---------------------------------------------
       OFFICE CHANGE
    --------------------------------------------- */

    const officeDropdown =
        document.getElementById("routeOffice");

    if (officeDropdown) {

        officeDropdown.addEventListener(
            "change",
            updateCreateRouteButton
        );

    }


    /* ---------------------------------------------
       ROUTE NAME
    --------------------------------------------- */

    const routeNameInput =
        document.getElementById("routeName");

    if (routeNameInput) {

        routeNameInput.addEventListener(
            "input",
            updateCreateRouteButton
        );

    }


    /* ---------------------------------------------
       VILLAGE SEARCH
    --------------------------------------------- */

    const villageSearch =
        document.getElementById("villageSearch");

    if (villageSearch) {

        villageSearch.addEventListener(
            "input",
            function () {

                renderVillageList(
                    villageSearch.value.trim()
                );

            }
        );

    }


    /* ---------------------------------------------
       CLEAR
    --------------------------------------------- */

    const clearButton =
        document.getElementById("clearRouteBtn");

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            resetRouteForm
        );

    }


    /* ---------------------------------------------
       CREATE ROUTE
    --------------------------------------------- */

    const createButton =
        document.getElementById("createRouteBtn");

    if (createButton) {

        createButton.addEventListener(
            "click",
            createNewRoute
        );

    }


    /* ---------------------------------------------
       BACK TO DASHBOARD
    --------------------------------------------- */

    const backButton =
        document.getElementById("backToDashboardBtn");

    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "/geo/dashboard";

            }
        );

    }

}


/* =========================================================
   API HELPER
========================================================= */

async function fetchRouteAPI(url, options = {}) {

    const response =
        await fetch(url, options);

    let data = null;

    try {

        data = await response.json();

    } catch (error) {

        data = null;

    }


    if (!response.ok) {

        let message =
            "Unable to process request.";

        if (
            data &&
            typeof data.detail === "string"
        ) {

            message = data.detail;

        }

        throw new Error(message);

    }


    return data;

}

/* =========================================================
   LOAD STATES
========================================================= */

async function loadRouteStates() {

    const stateDropdown =
        document.getElementById("routeState");

    if (!stateDropdown) return;


    try {

        setSelectLoading(
            stateDropdown,
            "Loading States..."
        );


        const data =
            await fetchRouteAPI(
                "/route-management/states"
            );


        stateDropdown.innerHTML =
            `<option value="">Select State</option>`;


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            stateDropdown.innerHTML =
                `<option value="">No States Found</option>`;

            stateDropdown.disabled = true;

            return;

        }


        data.forEach(function (state) {

            const option =
                document.createElement("option");

            option.value =
                state.state_code;

            option.textContent =
                state.state_name;

            stateDropdown.appendChild(option);

        });


        // Enable State dropdown after states are loaded
        stateDropdown.disabled = false;


    } catch (error) {

        console.error(
            "Route States API Error:",
            error
        );


        stateDropdown.innerHTML =
            `<option value="">Unable to load states</option>`;

        stateDropdown.disabled = true;


        showRouteError(
            error.message
        );

    }

}

/* =========================================================
   STATE CHANGE
========================================================= */

async function handleRouteStateChange() {

    const stateDropdown =
        document.getElementById("routeState");

    const stateCode =
        stateDropdown.value;


    resetDistrictDropdown();

    resetBlockDropdown();

    resetOfficeDropdown();

    resetVillages();


    if (!stateCode) {

        updateCreateRouteButton();

        return;

    }


    await loadRouteDistricts(
        stateCode
    );

}


/* =========================================================
   LOAD DISTRICTS
========================================================= */

async function loadRouteDistricts(
    stateCode
) {

    const districtDropdown =
        document.getElementById("routeDistrict");


    try {

        setSelectLoading(
            districtDropdown,
            "Loading Districts..."
        );


        const data =
            await fetchRouteAPI(
                `/route-management/districts/${encodeURIComponent(stateCode)}`
            );


        districtDropdown.innerHTML =
            `<option value="">Select District</option>`;


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            districtDropdown.innerHTML =
                `<option value="">No Districts Found</option>`;

            districtDropdown.disabled = true;

            return;

        }


        data.forEach(function (district) {

            const option =
                document.createElement("option");

            option.value =
                district.district_code;

            option.textContent =
                district.district_name;

            districtDropdown.appendChild(option);

        });


        districtDropdown.disabled = false;


    } catch (error) {

        console.error(
            "Route Districts API Error:",
            error
        );


        districtDropdown.innerHTML =
            `<option value="">Unable to load districts</option>`;

        districtDropdown.disabled = true;


        showRouteError(
            error.message
        );

    }

}


/* =========================================================
   DISTRICT CHANGE
========================================================= */

async function handleRouteDistrictChange() {

    const districtDropdown =
        document.getElementById("routeDistrict");

    const districtCode =
        districtDropdown.value;


    resetBlockDropdown();

    resetOfficeDropdown();

    resetVillages();


    if (!districtCode) {

        updateCreateRouteButton();

        return;

    }


    await loadRouteBlocks(
        districtCode
    );

}


/* =========================================================
   LOAD BLOCKS
========================================================= */

async function loadRouteBlocks(
    districtCode
) {

    const blockDropdown =
        document.getElementById("routeBlock");


    try {

        setSelectLoading(
            blockDropdown,
            "Loading Blocks..."
        );


        const data =
            await fetchRouteAPI(
                `/route-management/blocks/${encodeURIComponent(districtCode)}`
            );


        blockDropdown.innerHTML =
            `<option value="">Select Block</option>`;


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            blockDropdown.innerHTML =
                `<option value="">No Blocks Found</option>`;

            blockDropdown.disabled = true;

            return;

        }


        data.forEach(function (block) {

            const option =
                document.createElement("option");

            option.value =
                block.block_code;

            option.textContent =
                block.block_name;

            blockDropdown.appendChild(option);

        });


        blockDropdown.disabled = false;


    } catch (error) {

        console.error(
            "Route Blocks API Error:",
            error
        );


        blockDropdown.innerHTML =
            `<option value="">Unable to load blocks</option>`;

        blockDropdown.disabled = true;


        showRouteError(
            error.message
        );

    }

}


/* =========================================================
   BLOCK CHANGE
========================================================= */

async function handleRouteBlockChange() {

    const blockDropdown =
        document.getElementById("routeBlock");

    const blockCode =
        blockDropdown.value;


    resetOfficeDropdown();

    resetVillages();


    if (!blockCode) {

        updateCreateRouteButton();

        return;

    }


    /*
       Office and Villages are independent API calls
       for the selected Block.
    */

    await Promise.all([
        loadRouteOffices(blockCode),
        loadRouteVillages(blockCode)
    ]);

}


/* =========================================================
   LOAD OFFICES
========================================================= */

async function loadRouteOffices(
    blockId
) {

    const officeDropdown =
        document.getElementById("routeOffice");


    try {

        setSelectLoading(
            officeDropdown,
            "Loading Offices..."
        );


        const data =
            await fetchRouteAPI(
                `/route-management/offices/${encodeURIComponent(blockId)}`
            );


        officeDropdown.innerHTML =
            `<option value="">Select Office</option>`;


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            officeDropdown.innerHTML =
                `<option value="">No Offices Found</option>`;

            officeDropdown.disabled = true;

            return;

        }


        data.forEach(function (office) {

            const option =
                document.createElement("option");

            option.value =
                office.office_id;

            option.textContent =
                office.office_name;

            officeDropdown.appendChild(option);

        });


        officeDropdown.disabled = false;


    } catch (error) {

        console.error(
            "Route Offices API Error:",
            error
        );


        officeDropdown.innerHTML =
            `<option value="">Unable to load offices</option>`;

        officeDropdown.disabled = true;


        showRouteError(
            error.message
        );

    }

}


/* =========================================================
   LOAD VILLAGES
========================================================= */

async function loadRouteVillages(
    blockCode
) {

    const villageList =
        document.getElementById("villageList");


    try {

        showVillageLoading();


        const data =
            await fetchRouteAPI(
                `/route-management/villages/${encodeURIComponent(blockCode)}`
            );


        routeVillages =
            Array.isArray(data.villages)
                ? data.villages
                : [];


        selectedVillageIds.clear();


        updateVillageCount();

        updateHouseholdSummary();


        renderVillageList();


        updateCreateRouteButton();


    } catch (error) {

        console.error(
            "Route Villages API Error:",
            error
        );


        routeVillages = [];

        selectedVillageIds.clear();


        villageList.innerHTML = `
            <div class="village-list-empty">
                Unable to load villages.
            </div>
        `;


        updateVillageCount();

        updateHouseholdSummary();

        updateCreateRouteButton();


        showRouteError(
            error.message
        );

    }

}


/* =========================================================
   RENDER VILLAGE LIST
========================================================= */

function renderVillageList(
    searchText = ""
) {

    const villageList =
        document.getElementById("villageList");

    if (!villageList) return;


    const search =
        searchText.toLowerCase();


    const filteredVillages =
        routeVillages.filter(
            function (village) {

                const villageName =
                    String(
                        village.village_name || ""
                    ).toLowerCase();

                const villageCode =
                    String(
                        village.village_code || ""
                    ).toLowerCase();

                return (
                    villageName.includes(search) ||
                    villageCode.includes(search)
                );

            }
        );


    villageList.innerHTML = "";


    if (filteredVillages.length === 0) {

        villageList.innerHTML = `
            <div class="village-list-empty">
                ${
                    routeVillages.length === 0
                        ? "Select a Block to load villages."
                        : "No villages found."
                }
            </div>
        `;

        return;

    }


    filteredVillages.forEach(
        function (village) {

            const item =
                document.createElement("div");

            item.className =
                "village-item";


            const isSelected =
                selectedVillageIds.has(
                    Number(village.village_code)
                );


            if (isSelected) {

                item.classList.add(
                    "selected"
                );

            }


            const checkbox =
                document.createElement("input");

            checkbox.type =
                "checkbox";

            checkbox.value =
                village.village_code;

            checkbox.checked =
                isSelected;


            const name =
                document.createElement("div");

            name.className =
                "village-name";

            name.textContent =
                cleanVillageName(
                    village.village_name
                );


            const hh =
                document.createElement("div");

            hh.className =
                "village-hh";

            hh.textContent =
                `HH ${formatNumber(village.hh)}`;


            item.appendChild(
                checkbox
            );

            item.appendChild(
                name
            );

            item.appendChild(
                hh
            );


            /*
               Clicking anywhere on the item
               toggles the checkbox.
            */

            item.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target !== checkbox
                    ) {

                        checkbox.checked =
                            !checkbox.checked;

                    }


                    handleVillageSelection(
                        village,
                        checkbox.checked,
                        item
                    );

                }
            );


            checkbox.addEventListener(
                "change",
                function () {

                    handleVillageSelection(
                        village,
                        checkbox.checked,
                        item
                    );

                }
            );


            villageList.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   VILLAGE SELECTION
========================================================= */

function handleVillageSelection(
    village,
    selected,
    item
) {

    const villageId =
        Number(village.village_code);


    if (selected) {

        selectedVillageIds.add(
            villageId
        );

        item.classList.add(
            "selected"
        );

    } else {

        selectedVillageIds.delete(
            villageId
        );

        item.classList.remove(
            "selected"
        );

    }


    updateVillageCount();

    updateHouseholdSummary();

    updateCreateRouteButton();

}


/* =========================================================
   VILLAGE COUNT
========================================================= */

function updateVillageCount() {

    const countElement =
        document.getElementById(
            "villageCount"
        );

    if (!countElement) return;


    const count =
        routeVillages.length;


    countElement.textContent =
        `${count} ${
            count === 1
                ? "village"
                : "villages"
        }`;

}


/* =========================================================
   HOUSEHOLD SUMMARY
========================================================= */

function updateHouseholdSummary() {

    const selectedCountElement =
        document.getElementById(
            "selectedVillageCount"
        );

    const totalHouseholdsElement =
        document.getElementById(
            "totalHouseholds"
        );

    const validationElement =
        document.getElementById(
            "householdValidation"
        );


    const selectedVillages =
        routeVillages.filter(
            function (village) {

                return selectedVillageIds.has(
                    Number(village.village_code)
                );

            }
        );


    const totalHouseholds =
        selectedVillages.reduce(
            function (total, village) {

                const hh =
                    Number(village.hh) || 0;

                return total + hh;

            },
            0
        );


    if (selectedCountElement) {

        selectedCountElement.textContent =
            selectedVillages.length;

    }


    if (totalHouseholdsElement) {

        totalHouseholdsElement.textContent =
            formatNumber(totalHouseholds);

    }


    if (!validationElement) return;


    validationElement.className =
        "household-validation";


    if (selectedVillages.length === 0) {

        validationElement.classList.add(
            "neutral"
        );

        validationElement.textContent =
            "Select villages to calculate total households.";

        return;

    }


    if (
        totalHouseholds >= MIN_HOUSEHOLDS &&
        totalHouseholds <= MAX_HOUSEHOLDS
    ) {

        validationElement.classList.add(
            "valid"
        );

        validationElement.textContent =
            "✓ Household requirement satisfied.";

        return;

    }


    validationElement.classList.add(
        "invalid"
    );


    if (totalHouseholds < MIN_HOUSEHOLDS) {

        const remaining =
            MIN_HOUSEHOLDS -
            totalHouseholds;

        validationElement.textContent =
            `⚠ Select more villages. ` +
            `${formatNumber(remaining)} ` +
            `more households required.`;

        return;

    }


    if (totalHouseholds > MAX_HOUSEHOLDS) {

        const excess =
            totalHouseholds -
            MAX_HOUSEHOLDS;

        validationElement.textContent =
            `⚠ Household count exceeds ` +
            `the maximum by ` +
            `${formatNumber(excess)}.`;

    }

}


/* =========================================================
   UPDATE CREATE BUTTON
========================================================= */

function updateCreateRouteButton() {

    const createButton =
        document.getElementById(
            "createRouteBtn"
        );

    if (!createButton) return;


    if (isCreatingRoute) {

        createButton.disabled =
            true;

        return;

    }


    const state =
        document.getElementById(
            "routeState"
        )?.value || "";


    const district =
        document.getElementById(
            "routeDistrict"
        )?.value || "";


    const block =
        document.getElementById(
            "routeBlock"
        )?.value || "";


    const office =
        document.getElementById(
            "routeOffice"
        )?.value || "";


    const routeName =
        document.getElementById(
            "routeName"
        )?.value.trim() || "";


    const householdTotal =
        calculateSelectedHouseholds();


    const validHouseholds =
        householdTotal >= MIN_HOUSEHOLDS &&
        householdTotal <= MAX_HOUSEHOLDS;


    const validForm =
        Boolean(state) &&
        Boolean(district) &&
        Boolean(block) &&
        Boolean(office) &&
        Boolean(routeName) &&
        selectedVillageIds.size > 0 &&
        validHouseholds;


    createButton.disabled =
        !validForm;

}


/* =========================================================
   CALCULATE SELECTED HOUSEHOLDS
========================================================= */

function calculateSelectedHouseholds() {

    return routeVillages
        .filter(
            function (village) {

                return selectedVillageIds.has(
                    Number(village.village_code)
                );

            }
        )
        .reduce(
            function (total, village) {

                return (
                    total +
                    (Number(village.hh) || 0)
                );

            },
            0
        );

}


/* =========================================================
   CREATE ROUTE
========================================================= */

async function createNewRoute() {

    if (isCreatingRoute) return;


    /*
       Re-check validation before sending.
    */

    updateCreateRouteButton();


    const createButton =
        document.getElementById(
            "createRouteBtn"
        );


    if (createButton.disabled) {

        return;

    }


    const company =
        document.getElementById(
            "routeCompany"
        ).value;


    const stateCode =
        Number(
            document.getElementById(
                "routeState"
            ).value
        );


    const districtCode =
        Number(
            document.getElementById(
                "routeDistrict"
            ).value
        );


    const blockCode =
        Number(
            document.getElementById(
                "routeBlock"
            ).value
        );


    const officeId =
        Number(
            document.getElementById(
                "routeOffice"
            ).value
        );


    const routeName =
        document.getElementById(
            "routeName"
        ).value.trim();


    const villageIds =
        Array.from(
            selectedVillageIds
        );


    const payload = {

        company: company,

        state_code: stateCode,

        district_code: districtCode,

        block_code: blockCode,

        office_id: officeId,

        route_name: routeName,

        village_ids: villageIds

    };


    try {

        isCreatingRoute = true;


        createButton.disabled =
            true;

        createButton.textContent =
            "Creating Route...";


        const response =
            await fetchRouteAPI(
                "/route-management/routes",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );


        console.log(
            "Create Route Response:",
            response
        );


        showRouteSuccess(
            routeName
        );


    } catch (error) {

        console.error(
            "Create Route API Error:",
            error
        );


        showRouteError(
            error.message
        );


        isCreatingRoute = false;

        createButton.disabled =
            false;

        createButton.textContent =
            "Create Route";


        updateCreateRouteButton();

    }

}


/* =========================================================
   SUCCESS SCREEN
========================================================= */

function showRouteSuccess(
    routeName
) {

    const routeCard =
        document.querySelector(
            ".route-card"
        );

    if (!routeCard) return;


    routeCard.innerHTML = `

        <div
            style="
                min-height: 420px;
                display: flex;
                align-items: center;
                justify-content: center;
            "
        >

            <div
                style="
                    width: 100%;
                    max-width: 650px;
                    text-align: center;
                "
            >

                <div
                    style="
                        width: 64px;
                        height: 64px;
                        margin: 0 auto 20px;
                        border-radius: 50%;
                        background: #dcfce7;
                        color: #166534;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 30px;
                        font-weight: 600;
                    "
                >
                    ✓
                </div>


                <h2
                    style="
                        margin: 0 0 10px;
                        font-size: 22px;
                        color: #1f2937;
                    "
                >
                    Route created successfully
                </h2>


                <p
                    style="
                        margin: 0;
                        color: #6b7280;
                        font-size: 14px;
                    "
                >
                    Route
                    <strong>
                        ${escapeHtml(routeName)}
                    </strong>
                    has been created successfully.
                </p>


                <div
                    style="
                        margin-top: 30px;
                        display: flex;
                        justify-content: center;
                        gap: 10px;
                        flex-wrap: wrap;
                    "
                >

                    <button
                        type="button"
                        id="createAnotherRouteBtn"
                        class="create-route-btn"
                    >
                        Create Another Route
                    </button>


                    <button
                        type="button"
                        id="successBackDashboardBtn"
                        class="back-btn"
                    >
                        Back to Dashboard
                    </button>

                </div>

            </div>

        </div>

    `;


    const createAnotherButton =
        document.getElementById(
            "createAnotherRouteBtn"
        );


    if (createAnotherButton) {

    createAnotherButton.addEventListener(
        "click",
        function () {
            window.location.reload();
        }
    );

}


    const backButton =
        document.getElementById(
            "successBackDashboardBtn"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "/geo/dashboard";

            }
        );

    }

}


/* =========================================================
   RESET FORM
========================================================= */

function resetRouteForm() {

    isCreatingRoute = false;


    /*
       Company stays DDCL.
    */

    const companyDropdown =
        document.getElementById(
            "routeCompany"
        );

    if (companyDropdown) {

        companyDropdown.value =
            "DDCL";

    }


    resetSelect(
        document.getElementById(
            "routeState"
        ),
        "Select State"
    );


    resetDistrictDropdown();

    resetBlockDropdown();

    resetOfficeDropdown();

    resetVillages();


    const routeName =
        document.getElementById(
            "routeName"
        );

    if (routeName) {

        routeName.value =
            "";

    }


    const villageSearch =
        document.getElementById(
            "villageSearch"
        );

    if (villageSearch) {

        villageSearch.value =
            "";

    }


    const createButton =
        document.getElementById(
            "createRouteBtn"
        );

    if (createButton) {

        createButton.textContent =
            "Create Route";

    }


    loadRouteStates();

    updateCreateRouteButton();

}


/* =========================================================
   RESET DISTRICT
========================================================= */

function resetDistrictDropdown() {

    resetSelect(
        document.getElementById(
            "routeDistrict"
        ),
        "Select District"
    );

}


/* =========================================================
   RESET BLOCK
========================================================= */

function resetBlockDropdown() {

    resetSelect(
        document.getElementById(
            "routeBlock"
        ),
        "Select Block"
    );

}


/* =========================================================
   RESET OFFICE
========================================================= */

function resetOfficeDropdown() {

    resetSelect(
        document.getElementById(
            "routeOffice"
        ),
        "Select Office"
    );

}


/* =========================================================
   RESET VILLAGES
========================================================= */

function resetVillages() {

    routeVillages = [];

    selectedVillageIds.clear();


    const villageSearch =
        document.getElementById(
            "villageSearch"
        );

    if (villageSearch) {

        villageSearch.value =
            "";

    }


    const villageList =
        document.getElementById(
            "villageList"
        );

    if (villageList) {

        villageList.innerHTML = `
            <div class="village-list-empty">
                Select a Block to load villages.
            </div>
        `;

    }


    updateVillageCount();

    updateHouseholdSummary();

    updateCreateRouteButton();

}


/* =========================================================
   RESET SELECT
========================================================= */

function resetSelect(
    element,
    placeholder
) {

    if (!element) return;


    element.innerHTML =
        `<option value="">${placeholder}</option>`;


    element.disabled =
        true;

}


/* =========================================================
   SET SELECT LOADING
========================================================= */

function setSelectLoading(
    element,
    message
) {

    if (!element) return;


    element.innerHTML =
        `<option value="">${message}</option>`;


    element.disabled =
        true;

}


/* =========================================================
   VILLAGE LOADING
========================================================= */

function showVillageLoading() {

    const villageList =
        document.getElementById(
            "villageList"
        );


    if (!villageList) return;


    villageList.innerHTML = `
        <div class="village-list-empty">
            Loading villages...
        </div>
    `;

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
    value
) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        "en-IN"
    );

}


/* =========================================================
   CLEAN VILLAGE NAME
========================================================= */

function cleanVillageName(
    villageName
) {

    if (
        villageName === null ||
        villageName === undefined
    ) {

        return "-";

    }


    /*
       Current SP returns village_name
       with ", HH " appended.

       Example:
       "Village A, HH "

       Remove that display suffix because
       HH is displayed separately.
    */

    return String(villageName)
        .replace(/,\s*HH\s*$/i, "")
        .trim();

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function showRouteError(
    message
) {

    /*
       For the first version, use a simple
       browser alert so we don't introduce
       another UI component.

       We can replace this with a proper
       inline toast/modal later.
    */

    alert(
        message ||
        "Something went wrong. Please try again."
    );

}