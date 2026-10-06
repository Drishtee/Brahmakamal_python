from app.geo.service import get_connection


def get_csp_counts_by_district(district_code):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "EXEC usp_get_csp_count_by_district ?",
            district_code
        )

        columns = [
            col[0]
            for col in cursor.description
        ]

        rows = cursor.fetchall()

        result = []

        for row in rows:
            data = dict(zip(columns, row))

            result.append({
                "block_code": data.get("block_code"),
                "csp_count": data.get("csp_count")
            })

        return result

    finally:
        cursor.close()
        conn.close()
        
        
def get_csp_counts_by_district(district_code):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "EXEC usp_get_csp_count_by_district ?",
            district_code
        )

        columns = [
            col[0]
            for col in cursor.description
        ]

        rows = cursor.fetchall()

        result = []

        for row in rows:
            data = dict(zip(columns, row))

            result.append({
                "block_code": data.get("block_code"),
                "csp_count": data.get("csp_count")
            })

        return result

    finally:
        cursor.close()
        conn.close()


def get_csps_by_block_codes(block_codes):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        block_code_string = ",".join(
            str(block_code)
            for block_code in block_codes
        )

        cursor.execute(
            "EXEC usp_get_csp_list_by_block_codes ?",
            block_code_string
        )

        columns = [
            col[0]
            for col in cursor.description
        ]

        rows = cursor.fetchall()

        result = []

        for row in rows:
            data = dict(zip(columns, row))

            result.append({
                "bank": data.get("BANK"),
                "csp_code": data.get("CSPCODE"),
                "csp_name": data.get("CSP_Name"),

                "state": data.get("State"),
                "territory": data.get("Territory"),
                "district": data.get("District"),
                "block": data.get("BLOCK"),

                "village_id": data.get("VillageId"),
                "village_name": data.get("village_name"),

                "vatika_id": data.get("Vatika_id"),
                "physical_vatika_id": data.get("Physical_VatikaId"),
                "vatika": data.get("Vatika"),

                "block_code": data.get("block_code"),
                "block_name": data.get("block_name"),

                "bhk_block_code": data.get("bhk_block_code"),
                "status": data.get("Status"),
                "branch": data.get("Branch"),

                "csp_lat": data.get("csp_lat"),
                "csp_long": data.get("csp_long")
            })

        return result

    finally:
        cursor.close()
        conn.close()