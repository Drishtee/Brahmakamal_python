import pyodbc

from app.config import settings
import pyodbc
from app.geo.voronoi import generate_voronoi_geojson

def get_connection():
    conn_str = (
        f"DRIVER={{{settings.DB_DRIVER}}};"
        f"SERVER={settings.DB_SERVER};"
        f"DATABASE={settings.DB_NAME};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD}"
    )
    pyodbc.pooling = True
    return pyodbc.connect(conn_str)


def get_territories(state_code=None):
    conn = get_connection()
    cursor = conn.cursor()

    # Execute SP
    if state_code:
        cursor.execute("EXEC usp_get_territories_block_by_state ?", state_code)
    else:
        cursor.execute("EXEC usp_get_territories_block_by_state NULL")

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:
        data = dict(zip(columns, row))

        #  Standard response
        formatted = {
            "state": data.get("state_name"),
            "name": data.get("territory_name"),
            "code": data.get("territory_code"),

            # safe fallback
            "district": data.get("district_name") if "district_name" in data else None,
            "block": data.get("block_name") if "block_name" in data else None
        }

        result.append(formatted)

    conn.close()
    return result




def get_states():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("EXEC usp_select_state_master_with_cdns")

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:
        data = dict(zip(columns, row))

        result.append({
            "state_code": data.get("state_code"),
            "state_name": data.get("state_name"),
            "lat": float(data.get("latitude")),
            "lng": float(data.get("longitude"))
        })
        # print(result)
    conn.close()
    return result

def get_districts(state_code):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "EXEC usp_select_dist_master_with_cdns ?",
        state_code
    )

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:
        data = dict(zip(columns, row))

        result.append({
            "district_id": data.get("district_id"),
            "district_name": data.get("District_name"),
            "lat": data.get("Dist_lat"),
            "lng": data.get("Dist_lng")
})
    conn.close()
    return result



def get_blocks(dist_code):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "EXEC usp_select_block_master_with_cdns ?",
        dist_code
    )

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:

        data = dict(zip(columns, row))

        result.append({
            "block_code": data.get("Block_Code"),
            "block_name": data.get("Block_Name"),
            "population": data.get("total_population"),
            "lat": data.get("block_lat"),
            "lng": data.get("block_lng")
        })

    conn.close()

    return result

def get_villages(block_codes):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "EXEC usp_select_village_details_by_block_new ?",
        block_codes
    )

    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()

    result = []

    for row in rows:

        data = dict(zip(columns, row))

        result.append({
            "block_name": data.get("block_name"),
            "village_code": data.get("Village_Code"),
            "village_name": data.get("Village_Name"),
            "population": data.get("total_population"),
            "houses": data.get("total_number_of_houses"),
            "female_population": data.get("female_population"),
            "male_population": data.get("male_population"),
            "female_literacy": data.get("literacy_rate_female"),
            "male_literacy": data.get("literacy_rate_male"),
            "main_crop": data.get("main_crop"),
            "agri_land": data.get("aggri_land"),
            "bpl_ratio": data.get("bpl_ratio")
        })

    conn.close()

    return result

def get_vatikas(block_codes):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(

        "EXEC usp_select_vatika_villages_by_block ?",

        block_codes
    )

    columns = [
        col[0]
        for col in cursor.description
    ]

    rows = cursor.fetchall()

    result = []

    for row in rows:

        data = dict(
            zip(columns, row)
        )

        result.append({

            "block_name":
                data.get("block_name"),

            "vatika_code":
                data.get("Vatika_Code"),

            "vatika_name":
                data.get("Vatika_Name"),

            "village_name":
                data.get("Village_Name"),

            "households":
                data.get("Households"),

            "lat":
                data.get("village_lat"),

            "lng":
                data.get("village_lng"),

            "is_physical":
                data.get("is_physical")
        })

    conn.close()

    return result

def get_routes(block_codes):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute(

        "EXEC usp_get_routes_by_block_code_new ?",

        block_codes
    )

    columns = [
        col[0]
        for col in cursor.description
    ]

    rows = cursor.fetchall()

    result = []

    for row in rows:

        data = dict(
            zip(columns, row)
        )

        result.append({

            "block_name":
                data.get("block_name"),

            "route_code":
                data.get("route_code"),

            "route_name":
                data.get("route_name"),

            "route_village":
                data.get("route_village"),

            "village_hh":
                data.get("village_hh"),

            "google_maps_link":
                data.get("GoogleMapsLink")
        })

    conn.close()

    return result

def get_physical_routes(block_codes):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "EXEC usp_get_physical_routes_by_block_code_new ?",
        block_codes
    )

    columns = [
        col[0]
        for col in cursor.description
    ]

    rows = cursor.fetchall()

    result = []

    for row in rows:

        data = dict(
            zip(columns, row)
        )

        result.append({

            "block_name":
                data.get("block_name"),

            "route_code":
                data.get("route_code"),

            "route_name":
                data.get("route_name"),

            "route_village":
                data.get("route_village"),

            "village_hh":
                data.get("village_hh"),

            "google_maps_link":
                data.get("GoogleMapsLink"),

            "block_lat":
                data.get("block_lat"),

            "block_lng":
                data.get("block_lng"),

            "route_village_lat":
                data.get("route_village_lat"),

            "route_village_lng":
                data.get("route_village_lng")
        })

    conn.close()

    return result

def get_voronoi_geojson(block_code):

    return generate_voronoi_geojson(
        block_code
    )