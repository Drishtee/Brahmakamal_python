from app.geo.service import get_connection


COMPANY = "DDCL"


def get_route_edit_states():
    conn = get_connection()
    cursor = conn.cursor()

    try:
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

        return result

    finally:
        cursor.close()
        conn.close()


def get_route_edit_districts(state_code):
    conn = get_connection()
    cursor = conn.cursor()

    try:
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

        return result

    finally:
        cursor.close()
        conn.close()


def get_route_edit_blocks(district_code):
    conn = get_connection()
    cursor = conn.cursor()

    try:
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

        return result

    finally:
        cursor.close()
        conn.close()


def get_routes_to_edit(block_code):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            EXEC drishtee_mis..usp_get_route_to_edit_DDCL ?
            """,
            block_code
        )

        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()

        result = []

        for row in rows:
            data = dict(zip(columns, row))

            result.append({
                "route_id": data.get(
                    "route_code_main_village_code"
                ),
                "route_name": data.get(
                    "route_name_main_village_name"
                )
            })

        return result

    finally:
        cursor.close()
        conn.close()


def get_existing_route_villages(route_id):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            EXEC drishtee_mis..usp_get_route_remove_vil_by_routeId_DDCL ?
            """,
            route_id
        )

        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()

        result = []

        for row in rows:
            data = dict(zip(columns, row))

            result.append({
                "village_code": data.get("village_code"),
                "village_name": data.get("Village"),
                "hh": data.get("hh")
            })

        return result

    finally:
        cursor.close()
        conn.close()


def get_available_route_villages(route_id):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            EXEC drishtee_mis..usp_get_route_add_vil_by_routeId_DDCL ?
            """,
            route_id
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

        return result

    finally:
        cursor.close()
        conn.close()


def update_route(route_id, village_ids, user_id, flag):
    village_id_string = ",".join(
        str(village_id)
        for village_id in village_ids
    )

    if not village_id_string:
        return

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            EXEC drishtee_mis..Usp_edit_route_DDCL_BHK
                @routeId = ?,
                @VillageIds = ?,
                @userId = ?,
                @flag = ?
            """,
            route_id,
            village_id_string,
            user_id,
            flag
        )

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()