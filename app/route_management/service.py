from app.geo.service import get_connection


# =====================================================
# CONSTANTS
# =====================================================

COMPANY = "DDCL"


# =====================================================
# STATES
# =====================================================

def get_route_states():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "EXEC drishtee_mis..selectStateCode"
    )

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:
        data = dict(zip(columns, row))

        result.append({
            "state_code": data.get("state_code"),
            "state_name": data.get("state_name")
        })

    conn.close()

    return result


# =====================================================
# DISTRICTS
# =====================================================

def get_route_districts(state_code):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        EXEC drishtee_mis..usp_get_dist_by_st_code_MIS ?
        """,
        state_code
    )

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:
        data = dict(zip(columns, row))

        result.append({
            "district_code": data.get("district_code"),
            "district_name": data.get("district_name")
        })

    conn.close()

    return result


# =====================================================
# BLOCKS
# =====================================================

def get_route_blocks(district_code):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        EXEC drishtee_mis..usp_get_block_by_dist_code_MIS ?
        """,
        district_code
    )

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:
        data = dict(zip(columns, row))

        result.append({
            "block_code": data.get("block_code"),
            "block_name": data.get("block_name")
        })

    conn.close()

    return result


# =====================================================
# OFFICES
# =====================================================

def get_route_offices(block_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        EXEC drishtee_mis..usp_select_office_by_blockId ?
        """,
        block_id
    )

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:
        data = dict(zip(columns, row))

        result.append({
            "office_id": data.get("office_id"),
            "office_name": data.get("office_name")
        })

    conn.close()

    return result


# =====================================================
# VILLAGES
# =====================================================

def get_route_villages(block_code):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        EXEC drishtee_mis..usp_get_route_villages_by_block_code_DDCL ?
        """,
        block_code
    )

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:
        data = dict(zip(columns, row))

        result.append({
            "village_code": data.get("village_code"),
            "village_name": data.get("village_name"),
            "hh": data.get("hh")
        })

    conn.close()

    return result


# =====================================================
# CREATE ROUTE
# =====================================================

def create_route(
    route_name,
    village_ids,
    user_id,
    block_id,
    office_id
):
    # -------------------------------------------------
    # Convert Village IDs
    # -------------------------------------------------

    village_id_string = ",".join(
        str(village_id)
        for village_id in village_ids
    )

    # -------------------------------------------------
    # Database Connection
    # -------------------------------------------------

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # -------------------------------------------------
        # Execute Stored Procedure
        # -------------------------------------------------

        cursor.execute(
            """
            EXEC drishtee_mis..usp_insert_route_DDCL_BHK
                @Route_Name = ?,
                @VillageIDs = ?,
                @user_id = ?,
                @block_id = ?,
                @office_id = ?
            """,
            route_name,
            village_id_string,
            user_id,
            block_id,
            office_id
        )

        # -------------------------------------------------
        # Commit
        # -------------------------------------------------

        conn.commit()

    except Exception:
        # -------------------------------------------------
        # Rollback
        # -------------------------------------------------

        conn.rollback()
        raise

    finally:
        # -------------------------------------------------
        # Close Connection
        # -------------------------------------------------

        cursor.close()
        conn.close()