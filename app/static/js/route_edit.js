/* =========================================================
   ROUTE EDIT
   ========================================================= */

const MIN_HOUSEHOLDS = 7500;
const MAX_HOUSEHOLDS = 10000;
const COMPANY = "DDCL";


/* =========================================================
   STATE
   ========================================================= */

let existingVillages = [];
let availableVillages = [];

let addedVillageIds = new Set();
let removedVillageIds = new Set();

let selectedRouteId = null;
let isUpdatingRoute = false;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    setupEventListeners();

    await loadRouteStates();

    updateRouteSummary();
    updateUpdateRouteButton();
});


/* =========================================================
   DOM HELPERS
   ========================================================= */

function getElement(id) {
    return document.getElementById(id);
}
function showConfirmationModal(
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel"
) {
    return new Promise(function (resolve) {

        let overlay =
            getElement("routeConfirmationModal");

        if (!overlay) {

            overlay =
                document.createElement("div");

            overlay.id =
                "routeConfirmationModal";

            overlay.className =
                "route-confirmation-overlay";

            overlay.innerHTML = `
                <div
                    class="route-confirmation-modal"
                    role="dialog"
                    aria-modal="true"
                >

                    <div class="route-confirmation-content">

                        <h3
                            id="routeConfirmationTitle"
                            class="route-confirmation-title"
                        ></h3>

                        <p
                            id="routeConfirmationMessage"
                            class="route-confirmation-message"
                        ></p>

                        <div class="route-confirmation-actions">

                            <button
                                type="button"
                                id="routeConfirmationCancelBtn"
                                class="route-confirmation-btn route-confirmation-cancel"
                            ></button>

                            <button
                                type="button"
                                id="routeConfirmationConfirmBtn"
                                class="route-confirmation-btn route-confirmation-confirm"
                            ></button>

                        </div>

                    </div>

                </div>
            `;

            document.body.appendChild(overlay);

            const style =
                document.createElement("style");

            style.textContent = `
                .route-confirmation-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(17, 24, 39, 0.45);
                    opacity: 0;
                    visibility: hidden;
                    transition:
                        opacity 0.18s ease,
                        visibility 0.18s ease;
                }

                .route-confirmation-overlay.show {
                    opacity: 1;
                    visibility: visible;
                }

                .route-confirmation-modal {
                    width: 100%;
                    max-width: 440px;
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow:
                        0 12px 35px rgba(0, 0, 0, 0.18);
                }

                .route-confirmation-content {
                    padding: 24px;
                }

                .route-confirmation-title {
                    margin: 0 0 10px;
                    color: #1f2937;
                    font-size: 18px;
                    font-weight: 600;
                    line-height: 1.4;
                }

                .route-confirmation-message {
                    margin: 0;
                    color: #6b7280;
                    font-size: 14px;
                    line-height: 1.6;
                }

                .route-confirmation-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 24px;
                }

                .route-confirmation-btn {
                    height: 40px;
                    padding: 0 16px;
                    border-radius: 8px;
                    font-family: "Segoe UI", sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                }

                .route-confirmation-cancel {
                    background: #ffffff;
                    color: #374151;
                    border: 1px solid #d1d5db;
                }

                .route-confirmation-cancel:hover {
                    background: #f9fafb;
                }

                .route-confirmation-confirm {
                    background: #1D9E75;
                    color: #ffffff;
                    border: 1px solid #1D9E75;
                }

                .route-confirmation-confirm:hover {
                    background: #178866;
                    border-color: #178866;
                }

                @media (max-width: 480px) {

                    .route-confirmation-content {
                        padding: 20px;
                    }

                    .route-confirmation-actions {
                        flex-direction: column-reverse;
                    }

                    .route-confirmation-btn {
                        width: 100%;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        const titleElement =
            getElement("routeConfirmationTitle");

        const messageElement =
            getElement("routeConfirmationMessage");

        const cancelButton =
            getElement("routeConfirmationCancelBtn");

        const confirmButton =
            getElement("routeConfirmationConfirmBtn");

        titleElement.textContent = title;
        messageElement.textContent = message;

        cancelButton.textContent =
            cancelText;

        confirmButton.textContent =
            confirmText;

        let settled = false;

        function closeModal(result) {

            if (settled) {
                return;
            }

            settled = true;

            overlay.classList.remove("show");

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            resolve(result);
        }

        function handleKeyDown(event) {

            if (event.key === "Escape") {
                closeModal(false);
            }
        }

        cancelButton.onclick =
            function () {
                closeModal(false);
            };

        confirmButton.onclick =
            function () {
                closeModal(true);
            };

        overlay.onclick =
            function (event) {

                if (event.target === overlay) {
                    closeModal(false);
                }
            };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        overlay.classList.add("show");

        setTimeout(function () {
            confirmButton.focus();
        }, 50);
    });
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    const stateDropdown = getElement("routeState");

    const districtDropdown = getElement("routeDistrict");

    const blockDropdown = getElement("routeBlock");

    const routeDropdown = getElement("routeSelect");

    const existingSearch = getElement(
        "existingVillageSearch"
    );

    const availableSearch = getElement(
        "availableVillageSearch"
    );

    const updateButton = getElement(
        "updateRouteBtn"
    );

    const cancelButton = getElement(
        "cancelRouteBtn"
    );

    const backButton = getElement(
        "backToDashboardBtn"
    );

    const editAnotherButton = getElement(
        "editAnotherRouteBtn"
    );

    const successBackButton = getElement(
        "successBackToDashboardBtn"
    );


    if (stateDropdown) {
        stateDropdown.addEventListener(
            "change",
            handleStateChange
        );
    }


    if (districtDropdown) {
        districtDropdown.addEventListener(
            "change",
            handleDistrictChange
        );
    }


    if (blockDropdown) {
        blockDropdown.addEventListener(
            "change",
            handleBlockChange
        );
    }


    if (routeDropdown) {
        routeDropdown.addEventListener(
            "change",
            handleRouteChange
        );
    }


    if (existingSearch) {
        existingSearch.addEventListener(
            "input",
            function () {
                renderExistingVillages(
                    existingSearch.value
                );
            }
        );
    }


    if (availableSearch) {
        availableSearch.addEventListener(
            "input",
            function () {
                renderAvailableVillages(
                    availableSearch.value
                );
            }
        );
    }


    if (updateButton) {
        updateButton.addEventListener(
            "click",
            updateRoute
        );
    }


    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            cancelRouteEdit
        );
    }


    if (backButton) {
        backButton.addEventListener(
            "click",
            function () {
                window.location.href = "/geo/dashboard";
            }
        );
    }


    if (editAnotherButton) {
        editAnotherButton.addEventListener(
            "click",
            function () {
                window.location.reload();
            }
        );
    }


    if (successBackButton) {
        successBackButton.addEventListener(
            "click",
            function () {
                window.location.href = "/geo/dashboard";
            }
        );
    }
}


/* =========================================================
   API HELPER
   ========================================================= */

async function fetchRouteEditAPI(
    url,
    options = {}
) {

    const response = await fetch(
        url,
        options
    );

    if (!response.ok) {

        let errorMessage =
            "Something went wrong.";

        try {

            const errorData =
                await response.json();

            if (errorData.detail) {
                errorMessage =
                    errorData.detail;
            }

        } catch (error) {
            // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
    }

    return response.json();
}


/* =========================================================
   DROPDOWN HELPERS
   ========================================================= */

function resetDropdown(
    dropdown,
    placeholder
) {

    if (!dropdown) {
        return;
    }

    dropdown.innerHTML = "";

    const option =
        document.createElement("option");

    option.value = "";
    option.textContent = placeholder;

    dropdown.appendChild(option);

    dropdown.value = "";
}


function populateDropdown(
    dropdown,
    items,
    valueKey,
    textKey,
    placeholder
) {

    if (!dropdown) {
        return;
    }

    resetDropdown(
        dropdown,
        placeholder
    );

    items.forEach(function (item) {

        const option =
            document.createElement("option");

        option.value =
            item[valueKey];

        option.textContent =
            item[textKey];

        dropdown.appendChild(option);
    });
}


/* =========================================================
   LOAD STATES
   ========================================================= */

async function loadRouteStates() {

    const stateDropdown =
        getElement("routeState");

    try {

        stateDropdown.disabled = true;

        const states =
            await fetchRouteEditAPI(
                "/route-edit/states"
            );

        populateDropdown(
            stateDropdown,
            states,
            "state_code",
            "state_name",
            "Select State"
        );

        stateDropdown.disabled = false;

    } catch (error) {

        console.error(
            "Route States API Error:",
            error
        );

        showPageError(
            "Unable to load states."
        );
    }
}


/* =========================================================
   STATE CHANGE
   ========================================================= */

async function handleStateChange() {

    const stateDropdown =
        getElement("routeState");

    const districtDropdown =
        getElement("routeDistrict");

    const blockDropdown =
        getElement("routeBlock");

    const routeDropdown =
        getElement("routeSelect");


    const stateCode =
        stateDropdown.value;


    /* Reset everything below State */

    resetDropdown(
        districtDropdown,
        "Select District"
    );

    resetDropdown(
        blockDropdown,
        "Select Block"
    );

    resetDropdown(
        routeDropdown,
        "Select Route"
    );


    districtDropdown.disabled = true;
    blockDropdown.disabled = true;
    routeDropdown.disabled = true;


    resetVillageState();


    if (!stateCode) {
        return;
    }


    try {

        const districts =
            await fetchRouteEditAPI(
                `/route-edit/districts/${stateCode}`
            );

        populateDropdown(
            districtDropdown,
            districts,
            "district_code",
            "district_name",
            "Select District"
        );

        districtDropdown.disabled = false;

    } catch (error) {

        console.error(
            "Route Districts API Error:",
            error
        );

        showPageError(
            "Unable to load districts."
        );
    }
}


/* =========================================================
   DISTRICT CHANGE
   ========================================================= */

async function handleDistrictChange() {

    const districtDropdown =
        getElement("routeDistrict");

    const blockDropdown =
        getElement("routeBlock");

    const routeDropdown =
        getElement("routeSelect");


    const districtCode =
        districtDropdown.value;


    resetDropdown(
        blockDropdown,
        "Select Block"
    );

    resetDropdown(
        routeDropdown,
        "Select Route"
    );


    blockDropdown.disabled = true;
    routeDropdown.disabled = true;


    resetVillageState();


    if (!districtCode) {
        return;
    }


    try {

        const blocks =
            await fetchRouteEditAPI(
                `/route-edit/blocks/${districtCode}`
            );

        populateDropdown(
            blockDropdown,
            blocks,
            "block_code",
            "block_name",
            "Select Block"
        );

        blockDropdown.disabled = false;

    } catch (error) {

        console.error(
            "Route Blocks API Error:",
            error
        );

        showPageError(
            "Unable to load blocks."
        );
    }
}


/* =========================================================
   BLOCK CHANGE
   ========================================================= */

async function handleBlockChange() {

    const blockDropdown =
        getElement("routeBlock");

    const routeDropdown =
        getElement("routeSelect");


    const blockCode =
        blockDropdown.value;


    resetDropdown(
        routeDropdown,
        "Select Route"
    );

    routeDropdown.disabled = true;


    resetVillageState();


    if (!blockCode) {
        return;
    }


    try {

        const routes =
            await fetchRouteEditAPI(
                `/route-edit/routes/${blockCode}`
            );

        populateDropdown(
            routeDropdown,
            routes,
            "route_id",
            "route_name",
            "Select Route"
        );

        routeDropdown.disabled = false;

    } catch (error) {

        console.error(
            "Route List API Error:",
            error
        );

        showPageError(
            "Unable to load routes."
        );
    }
}


/* =========================================================
   ROUTE CHANGE
   ========================================================= */

async function handleRouteChange() {

    const routeDropdown =
        getElement("routeSelect");

    const routeId =
        routeDropdown.value;


    resetVillageState();


    if (!routeId) {
        return;
    }


    selectedRouteId =
        Number(routeId);


    try {

        setVillageSectionLoading(
            true
        );


        const data =
            await fetchRouteEditAPI(
                `/route-edit/routes/${routeId}/villages`
            );


        existingVillages =
            Array.isArray(
                data.existing_villages
            )
                ? data.existing_villages
                : [];


        availableVillages =
            Array.isArray(
                data.available_villages
            )
                ? data.available_villages
                : [];


        /*
         * Initially every village returned by
         * the existing-villages SP belongs to
         * the route.
         */

        addedVillageIds.clear();

        removedVillageIds.clear();


        renderExistingVillages();

        renderAvailableVillages();

        updateRouteSummary();

        showVillageSections();


    } catch (error) {

        console.error(
            "Route Villages API Error:",
            error
        );

        showPageError(
            "Unable to load route villages."
        );

        resetVillageState();

    } finally {

        setVillageSectionLoading(
            false
        );
    }
}


/* =========================================================
   RESET VILLAGE STATE
   ========================================================= */

function resetVillageState() {

    selectedRouteId = null;

    existingVillages = [];
    availableVillages = [];

    addedVillageIds.clear();
    removedVillageIds.clear();


    const existingSearch =
        getElement(
            "existingVillageSearch"
        );

    const availableSearch =
        getElement(
            "availableVillageSearch"
        );


    if (existingSearch) {
        existingSearch.value = "";
    }

    if (availableSearch) {
        availableSearch.value = "";
    }


    renderExistingVillages();

    renderAvailableVillages();

    updateRouteSummary();

    hideVillageSections();
}


/* =========================================================
   SHOW / HIDE VILLAGE SECTIONS
   ========================================================= */

function showVillageSections() {

    const villageSection =
        getElement(
            "villageManagementSection"
        );

    const summarySection =
        getElement(
            "routeSummarySection"
        );

    const actions =
        getElement(
            "routeActions"
        );


    if (villageSection) {
        villageSection.style.display =
            "block";
    }

    if (summarySection) {
        summarySection.style.display =
            "block";
    }

    if (actions) {
        actions.style.display =
            "flex";
    }
}


function hideVillageSections() {

    const villageSection =
        getElement(
            "villageManagementSection"
        );

    const summarySection =
        getElement(
            "routeSummarySection"
        );

    const actions =
        getElement(
            "routeActions"
        );


    if (villageSection) {
        villageSection.style.display =
            "none";
    }

    if (summarySection) {
        summarySection.style.display =
            "none";
    }

    if (actions) {
        actions.style.display =
            "none";
    }
}


/* =========================================================
   VILLAGE LOADING STATE
   ========================================================= */

function setVillageSectionLoading(
    loading
) {

    const villageSection =
        getElement(
            "villageManagementSection"
        );

    if (!villageSection) {
        return;
    }

    if (loading) {

        villageSection.classList.add(
            "loading"
        );

    } else {

        villageSection.classList.remove(
            "loading"
        );
    }
}


/* =========================================================
   RENDER EXISTING VILLAGES
   ========================================================= */

function renderExistingVillages(
    searchTerm = ""
) {

    const container =
        getElement(
            "existingVillageList"
        );

    const countElement =
        getElement(
            "existingVillageCount"
        );


    if (!container) {
        return;
    }


    /*
     * Existing list should contain:
     *
     * 1. Original existing villages that
     *    haven't been removed.
     *
     * 2. Newly added villages.
     *
     * Newly added villages are removed
     * from the Available list.
     */

    const villagesToDisplay = [];


    existingVillages.forEach(
        function (village) {

            if (
                !removedVillageIds.has(
                    Number(village.village_code)
                )
            ) {

                villagesToDisplay.push(
                    village
                );
            }
        }
    );


    availableVillages.forEach(
        function (village) {

            if (
                addedVillageIds.has(
                    Number(village.village_code)
                )
            ) {

                villagesToDisplay.push(
                    village
                );
            }
        }
    );


    const normalizedSearch =
        searchTerm
            .trim()
            .toLowerCase();


    const filteredVillages =
        villagesToDisplay.filter(
            function (village) {

                if (!normalizedSearch) {
                    return true;
                }

                return String(
                    village.village_name || ""
                )
                    .toLowerCase()
                    .includes(
                        normalizedSearch
                    );
            }
        );


    countElement.textContent =
        villagesToDisplay.length;


    container.innerHTML = "";


    if (filteredVillages.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "village-empty";

        empty.textContent =
            normalizedSearch
                ? "No villages found."
                : "No existing villages.";

        container.appendChild(empty);

        return;
    }


    filteredVillages.forEach(
        function (village) {

            const villageId =
                Number(
                    village.village_code
                );

            const isNewlyAdded =
                addedVillageIds.has(
                    villageId
                );


            const item =
                createVillageItem(
                    village,
                    isNewlyAdded
                        ? "remove"
                        : "remove"
                );


            container.appendChild(item);
        }
    );
}


/* =========================================================
   RENDER AVAILABLE VILLAGES
   ========================================================= */

function renderAvailableVillages(
    searchTerm = ""
) {

    const container =
        getElement(
            "availableVillageList"
        );

    const countElement =
        getElement(
            "availableVillageCount"
        );


    if (!container) {
        return;
    }


    /*
     * Villages that have been added are
     * temporarily removed from the
     * Available list.
     */

    const villagesToDisplay =
        availableVillages.filter(
            function (village) {

                return !addedVillageIds.has(
                    Number(village.village_code)
                );
            }
        );


    const normalizedSearch =
        searchTerm
            .trim()
            .toLowerCase();


    const filteredVillages =
        villagesToDisplay.filter(
            function (village) {

                if (!normalizedSearch) {
                    return true;
                }

                return String(
                    village.village_name || ""
                )
                    .toLowerCase()
                    .includes(
                        normalizedSearch
                    );
            }
        );


    countElement.textContent =
        villagesToDisplay.length;


    container.innerHTML = "";


    if (filteredVillages.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "village-empty";

        empty.textContent =
            normalizedSearch
                ? "No villages found."
                : "No available villages.";

        container.appendChild(empty);

        return;
    }


    filteredVillages.forEach(
        function (village) {

            const item =
                createVillageItem(
                    village,
                    "add"
                );

            container.appendChild(item);
        }
    );
}


/* =========================================================
   CREATE VILLAGE ITEM
   ========================================================= */

function createVillageItem(
    village,
    action
) {

    const item =
        document.createElement("div");

    item.className =
        "village-item";


    const info =
        document.createElement("div");

    info.className =
        "village-info";


    const name =
        document.createElement("div");

    name.className =
        "village-name";

    name.textContent =
        village.village_name ||
        "Unnamed Village";


    const hh =
        document.createElement("div");

    hh.className =
        "village-hh";

    hh.textContent =
        `${formatNumber(village.hh)} HH`;


    info.appendChild(name);

    info.appendChild(hh);


    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "village-action-btn";


    const villageId =
        Number(village.village_code);


    if (action === "add") {

        button.classList.add(
            "add-village-btn"
        );

        button.textContent =
            "Add";

        button.addEventListener(
            "click",
            function () {
                addVillage(villageId);
            }
        );

    } else {

        button.classList.add(
            "remove-village-btn"
        );

        button.textContent =
            "Remove";

        button.addEventListener(
            "click",
            function () {
                removeVillage(villageId);
            }
        );
    }


    item.appendChild(info);

    item.appendChild(button);


    return item;
}


/* =========================================================
   ADD VILLAGE
   ========================================================= */

function addVillage(
    villageId
) {

    const village =
        availableVillages.find(
            function (item) {
                return Number(
                    item.village_code
                ) === villageId;
            }
        );


    if (!village) {
        return;
    }


    /*
     * If this village was previously
     * removed from the route, cancel
     * that removal.
     */

    const wasExisting =
        existingVillages.some(
            function (item) {
                return Number(
                    item.village_code
                ) === villageId;
            }
        );


    if (wasExisting) {

        removedVillageIds.delete(
            villageId
        );

    } else {

        addedVillageIds.add(
            villageId
        );
    }


    renderExistingVillages(
        getElement(
            "existingVillageSearch"
        ).value
    );

    renderAvailableVillages(
        getElement(
            "availableVillageSearch"
        ).value
    );


    updateRouteSummary();

    updateUpdateRouteButton();
}


/* =========================================================
   REMOVE VILLAGE
   ========================================================= */

function removeVillage(
    villageId
) {

    /*
     * If this village was newly added
     * during this edit session, removing
     * it simply cancels the addition.
     */

    if (
        addedVillageIds.has(
            villageId
        )
    ) {

        addedVillageIds.delete(
            villageId
        );

    } else {

        /*
         * Otherwise it is an original
         * route village, so track it
         * for deletion.
         */

        removedVillageIds.add(
            villageId
        );
    }


    renderExistingVillages(
        getElement(
            "existingVillageSearch"
        ).value
    );

    renderAvailableVillages(
        getElement(
            "availableVillageSearch"
        ).value
    );


    updateRouteSummary();

    updateUpdateRouteButton();
}


/* =========================================================
   ROUTE SUMMARY
   ========================================================= */

function updateRouteSummary() {

    const originalVillageCount =
        existingVillages.length;


    const addedCount =
        addedVillageIds.size;


    const removedCount =
        removedVillageIds.size;


    const finalVillageCount =
        originalVillageCount
        + addedCount
        - removedCount;


    const totalHouseholds =
        calculateFinalHouseholds();


    const existingElement =
        getElement(
            "summaryExistingVillages"
        );

    const addedElement =
        getElement(
            "summaryAddedVillages"
        );

    const removedElement =
        getElement(
            "summaryRemovedVillages"
        );

    const finalElement =
        getElement(
            "summaryFinalVillages"
        );


    if (existingElement) {
        existingElement.textContent =
            originalVillageCount;
    }

    if (addedElement) {
        addedElement.textContent =
            addedCount;
    }

    if (removedElement) {
        removedElement.textContent =
            removedCount;
    }

    if (finalElement) {
        finalElement.textContent =
            finalVillageCount;
    }


    const totalElement =
        getElement(
            "totalHouseholds"
        );


    if (totalElement) {

        totalElement.textContent =
            formatNumber(
                totalHouseholds
            );
    }


    updateHouseholdValidation(
        totalHouseholds
    );
}


/* =========================================================
   HOUSEHOLD CALCULATION
   ========================================================= */

function calculateFinalHouseholds() {

    let totalHouseholds = 0;


    /*
     * Start with all original villages
     * except villages marked for removal.
     */

    existingVillages.forEach(
        function (village) {

            const villageId =
                Number(
                    village.village_code
                );

            if (
                !removedVillageIds.has(
                    villageId
                )
            ) {

                totalHouseholds +=
                    Number(
                        village.hh
                    ) || 0;
            }
        }
    );


    /*
     * Add newly added villages.
     */

    addedVillageIds.forEach(
        function (villageId) {

            const village =
                availableVillages.find(
                    function (item) {

                        return Number(
                            item.village_code
                        ) === villageId;
                    }
                );


            if (village) {

                totalHouseholds +=
                    Number(
                        village.hh
                    ) || 0;
            }
        }
    );


    return totalHouseholds;
}


/* =========================================================
   HOUSEHOLD VALIDATION
   ========================================================= */

function updateHouseholdValidation(
    totalHouseholds
) {

    const validationElement =
        getElement(
            "householdValidation"
        );


    if (!validationElement) {
        return;
    }


    validationElement.className =
        "validation-message";


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

        const required =
            MIN_HOUSEHOLDS -
            totalHouseholds;

        validationElement.textContent =
            `⚠ Need ${formatNumber(required)} more households.`;

        return;
    }


    if (totalHouseholds > MAX_HOUSEHOLDS) {

        const excess =
            totalHouseholds -
            MAX_HOUSEHOLDS;

        validationElement.textContent =
            `⚠ Exceeds maximum by ${formatNumber(excess)} households.`;
    }
}


/* =========================================================
   UPDATE BUTTON
   ========================================================= */

function updateUpdateRouteButton() {

    const updateButton =
        getElement(
            "updateRouteBtn"
        );


    if (!updateButton) {
        return;
    }


    const totalHouseholds =
        calculateFinalHouseholds();


    const hasChanges =
        addedVillageIds.size > 0 ||
        removedVillageIds.size > 0;


    const validHouseholds =
        totalHouseholds >= MIN_HOUSEHOLDS &&
        totalHouseholds <= MAX_HOUSEHOLDS;


    const canUpdate =
        selectedRouteId !== null &&
        hasChanges &&
        validHouseholds &&
        !isUpdatingRoute;


    updateButton.disabled =
        !canUpdate;
}


/* =========================================================
   UPDATE ROUTE
   ========================================================= */

async function updateRoute() {

    if (isUpdatingRoute) {
        return;
    }


    const totalHouseholds =
        calculateFinalHouseholds();


    if (
        totalHouseholds < MIN_HOUSEHOLDS ||
        totalHouseholds > MAX_HOUSEHOLDS
    ) {

        alert(
            `Total households must be between ${formatNumber(MIN_HOUSEHOLDS)} and ${formatNumber(MAX_HOUSEHOLDS)}.`
        );

        return;
    }


    if (
        !selectedRouteId
    ) {

        alert(
            "Please select a route."
        );

        return;
    }


    if (
        addedVillageIds.size === 0 &&
        removedVillageIds.size === 0
    ) {

        alert(
            "No changes have been made."
        );

        return;
    }


    const confirmed =
    await showConfirmationModal(
        "Confirm Route Update",
        "Are you sure you want to update this route?",
        "Update Route",
        "Cancel"
    );


if (!confirmed) {
    return;
}


    isUpdatingRoute = true;

    updateUpdateRouteButton();


    const updateButton =
        getElement(
            "updateRouteBtn"
        );


    if (updateButton) {

        updateButton.textContent =
            "Updating...";
    }


    try {

        const payload = {
            added_village_ids:
                Array.from(
                    addedVillageIds
                ),

            removed_village_ids:
                Array.from(
                    removedVillageIds
                )
        };


        const response =
            await fetchRouteEditAPI(
                `/route-edit/routes/${selectedRouteId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        if (
            response &&
            response.success
        ) {

            showRouteSuccess(
                response.message
            );

        } else {

            throw new Error(
                response?.message ||
                "Unable to update route."
            );
        }


    } catch (error) {

        console.error(
            "Update Route API Error:",
            error
        );

        alert(
            error.message ||
            "Unable to update route."
        );

    } finally {

        isUpdatingRoute = false;

        if (updateButton) {

            updateButton.textContent =
                "Update Route";
        }

        updateUpdateRouteButton();
    }
}


/* =========================================================
   SUCCESS SCREEN
   ========================================================= */

function showRouteSuccess(
    message
) {

    const routeDetails =
        document.querySelector(
            ".page-header"
        );

    const routeCards =
        document.querySelectorAll(
            ".card"
        );

    const routeActions =
        getElement(
            "routeActions"
        );

    const successSection =
        getElement(
            "routeSuccessSection"
        );


    if (routeDetails) {
        routeDetails.style.display =
            "none";
    }


    routeCards.forEach(
        function (card) {
            card.style.display =
                "none";
        }
    );


    if (routeActions) {
        routeActions.style.display =
            "none";
    }


    const successMessage =
        successSection?.querySelector(
            ".success-message"
        );


    if (successMessage) {

        successMessage.textContent =
            message ||
            "The route has been updated successfully.";
    }


    if (successSection) {

        successSection.style.display =
            "block";
    }
}


/* =========================================================
   CANCEL
   ========================================================= */

async function cancelRouteEdit() {

    if (
        addedVillageIds.size > 0 ||
        removedVillageIds.size > 0
    ) {

        const confirmed =
    await showConfirmationModal(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to cancel?",
        "Discard Changes",
        "Stay"
    );


        if (!confirmed) {
            return;
        }
    }


    window.location.href =
        "/geo/dashboard";
}


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function showPageError(
    message
) {

    console.error(
        message
    );

    alert(message);
}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(
    value
) {

    return Number(
        value || 0
    ).toLocaleString("en-IN");
}