/* =========================
   CSP VIEW ACCESS
========================= */

let cspAccess = false;


/* =========================
   CHECK CSP ACCESS
========================= */

async function checkCSPAccess() {

    try {

        const res = await fetch(
            "/csp-view/access"
        );

        if (!res.ok) {
            cspAccess = false;
            return false;
        }

        const data = await res.json();

        cspAccess =
            data.csp_access === true;

        return cspAccess;

    } catch (error) {

        console.error(
            "CSP Access API Error:",
            error
        );

        cspAccess = false;

        return false;
    }
}


/* =========================
   LOAD CSP BLOCK COUNTS
========================= */

async function loadCSPBlockCounts(
    distCode
) {

    try {

        if (!distCode || !cspAccess) {
            return [];
        }

        const res = await fetch(
            `/csp-view/block-counts?dist_code=${distCode}`
        );

        if (!res.ok) {

            console.error(
                "CSP Block Counts API Error:",
                res.status
            );

            return [];
        }

        const data =
            await res.json();

        console.log(
            "CSP Block Counts:",
            data
        );

        return data;

    } catch (error) {

        console.error(
            "CSP Block Counts Error:",
            error
        );

        return [];
    }
}


/* =========================
   LOAD CSP MARKERS
========================= */

async function loadCSPMarkers(blockCodes) {

    try {

        if (!blockCodes || cspAccess !== true) {
            return;
        }

        const res = await fetch(
            `/csp-view/csps?block_codes=${blockCodes}`
        );

        if (!res.ok) {

            console.error(
                "CSP List API Error:",
                res.status
            );

            return;
        }

        const data = await res.json();

        console.log(
            "CSP List:",
            data
        );

        renderCSPMarkers(data);

    } catch (error) {

        console.error(
            "CSP List Error:",
            error
        );

    }
}