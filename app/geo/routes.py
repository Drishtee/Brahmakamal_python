import colorsys
import math

import numpy as np
import pandas as pd
import pyodbc
from app.config import settings

from shapely.geometry import LineString, Point, mapping



# DB CONNECTION

def get_connection():

    conn_str = (

        f"DRIVER={{{settings.DB_DRIVER}}};"
        f"SERVER={settings.DB_SERVER};"
        f"DATABASE={settings.DB_NAME};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD}"
    )

    pyodbc.pooling = True

    return pyodbc.connect(
        conn_str
    )


# LINE STYLE CONSTANTS

# Baseline stroke width before the 10-20% bump.
BASE_STROKE_WIDTH = 2.0

# Applied multiplier (15% thicker — middle of the 10-20% ask).
STROKE_WIDTH_MULTIPLIER = 1.15

ROUTE_STROKE_WIDTH = round(
    BASE_STROKE_WIDTH * STROKE_WIDTH_MULTIPLIER,
    2
)


# CLEAN ROUTE DATA

def clean_route_dataframe(df):

    # CONVERT LAT/LNG (BLOCK + VILLAGE)

    for col in [
        "block_lat",
        "block_lng",
        "route_village_lat",
        "route_village_lng"
    ]:

        df[col] = pd.to_numeric(

            df[col],
            errors="coerce"
        )

    # REMOVE NULLS

    df = df.dropna(

        subset=[
            "block_lat",
            "block_lng",
            "route_village_lat",
            "route_village_lng"
        ]
    )

    # REMOVE DUPLICATE ROUTE LEGS


    df = df.drop_duplicates(

        subset=[
            "route_code",
            "route_village_lat",
            "route_village_lng"
        ],

        keep="first"
    )

    # VALID INDIA RANGE

    df = df[

        (df["route_village_lat"] >= 15) &
        (df["route_village_lat"] <= 35) &

        (df["route_village_lng"] >= 65) &
        (df["route_village_lng"] <= 95)
    ]

    return df


# ==========================================
# REMOVE OUT-OF-BOUND VILLAGES PER BLOCK
# Uses a dynamic distance threshold 
# ==========================================

def remove_out_of_bound_villages(
    df,
    k=2.5,
    min_radius=0.05
):
    """
    For a single block's rows, computes the
    distance of every route_village from the
    block lat/lng, then drops villages whose
    distance is a outlier 

    Threshold = median + k * MAD
    """

    if len(df) < 2:
        return df

    block_lat = df["block_lat"].iloc[0]
    block_lng = df["block_lng"].iloc[0]

    distances = np.sqrt(

        (df["route_village_lng"] - block_lng) ** 2 +
        (df["route_village_lat"] - block_lat) ** 2
    )

    median_dist = distances.median()

    mad = (
        (distances - median_dist).abs().median()
    )

    # MAD can be 0 when distances are tightly
    # packed — fall back to a fixed cushion.
    if mad == 0:
        mad = median_dist * 0.5 if median_dist > 0 else min_radius

    dynamic_bound = median_dist + k * mad

    dynamic_bound = max(
        dynamic_bound,
        min_radius
    )

    df = df[distances <= dynamic_bound]

    return df


# ==========================================
# DYNAMIC COLOURS 
# ==========================================

GOLDEN_ANGLE = 0.6180339887498949  # 1 / phi


def generate_route_color(seed_index):
    """
    Returns a hex colour string for a given
    integer seed (e.g. the route's position
    in a sorted, deterministic route list).
    """

    hue = (seed_index * GOLDEN_ANGLE) % 1.0


    saturation = 0.65
    lightness = 0.50

    r, g, b = colorsys.hls_to_rgb(
        hue,
        lightness,
        saturation
    )

    return "#{:02x}{:02x}{:02x}".format(
        int(round(r * 255)),
        int(round(g * 255)),
        int(round(b * 255))
    )


def build_route_color_map(route_codes):
    """
    Assigns a stable colour to each route_code.
    """

    sorted_codes = sorted(
        route_codes,
        key=lambda c: str(c)
    )

    return {

        code: generate_route_color(idx)

        for idx, code in enumerate(
            sorted_codes
        )
    }


# CURVE STYLE CONSTANTS

CURVE_BOW_RATIO = 0.18

CURVE_RESOLUTION = 24

def build_curved_line(
    origin,
    destination,
    bow_ratio=CURVE_BOW_RATIO,
    resolution=CURVE_RESOLUTION
):
    """
    Returns a list of (lng, lat) coordinates
    forming a quadratic Bezier curve from
    origin to destination.

    The control point is offset perpendicular
    to the straight line, scaled to the segment
    length, so short legs curve subtly and long
    legs don't end up razor-flat.
    """

    ox, oy = origin
    dx, dy = destination

    vx = dx - ox
    vy = dy - oy

    length = math.hypot(vx, vy)

    if length == 0:
        return [origin, destination]

    # Perpendicular unit vector — consistently
    # rotated the same way (90° clockwise) so

    px = vy / length
    py = -vx / length

    bow = length * bow_ratio

    midx = (ox + dx) / 2.0 + px * bow
    midy = (oy + dy) / 2.0 + py * bow

    coords = []

    for i in range(resolution + 1):

        t = i / resolution

        # Quadratic Bezier: B(t) = (1-t)^2 * P0
        #   + 2(1-t)t * P1 + t^2 * P2
        one_minus_t = 1 - t

        x = (

            (one_minus_t ** 2) * ox
            + 2 * one_minus_t * t * midx
            + (t ** 2) * dx
        )

        y = (

            (one_minus_t ** 2) * oy
            + 2 * one_minus_t * t * midy
            + (t ** 2) * dy
        )

        coords.append((x, y))

    return coords


# ==========================================
# COMPUTE BEARING BETWEEN TWO POINTS
# ==========================================

def compute_bearing(p_from, p_to):
    """
    Returns bearing in degrees clockwise from
    north (0-360), suitable for rotating a
    map-pin / arrow icon in most JS map libs
    (e.g. Mapbox GL `icon-rotate`).
    """

    lng1, lat1 = p_from
    lng2, lat2 = p_to

    d_lng = math.radians(lng2 - lng1)

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    x = math.sin(d_lng) * math.cos(lat2_rad)

    y = (

        math.cos(lat1_rad) * math.sin(lat2_rad)
        - math.sin(lat1_rad)
        * math.cos(lat2_rad)
        * math.cos(d_lng)
    )

    bearing = math.degrees(
        math.atan2(x, y)
    )

    return (bearing + 360) % 360


# ==========================================
# GENERATE ROUTES FOR A SINGLE BLOCK
# ==========================================

def generate_block_routes(df, block_name):

    df = clean_route_dataframe(df)

    df = remove_out_of_bound_villages(df)

    print(
        f"\n========== {block_name} =========="
    )

    print(
        f"Cleaned Row Count: {len(df)}"
    )

    if df.empty:
        return [], []

    color_map = build_route_color_map(
        df["route_code"].unique().tolist()
    )

    features = []

    legend_entries = []

    # ==========================================
    # BUILD ONE LINE PER (route, village) LEG
    # Each leg is block lat/lng -> village lat/lng
    # ==========================================

    for route_code, route_df in df.groupby("route_code"):

        route_color = color_map[route_code]

        route_name = str(
            route_df["route_name"].iloc[0]
        )

        google_maps_link = str(
            route_df["googlemapslink"].iloc[0]
        )

        total_villages = len(route_df)

        for _, row in route_df.iterrows():

            try:

                origin = (
                    row["block_lng"],
                    row["block_lat"]
                )

                destination = (
                    row["route_village_lng"],
                    row["route_village_lat"]
                )

                if origin == destination:
                    continue

                curve_coords = build_curved_line(
                    origin,
                    destination
                )

                line = LineString(
                    curve_coords
                )

                feature = {

                    "type": "Feature",

                    "properties": {

                        "feature_type":
                            "route",

                        "block_name":
                            str(block_name),

                        "route_code":
                            str(route_code),

                        "route_name":
                            route_name,

                        "route_village":
                            str(row["route_village"]),

                        "village_hh":

                            int(row["village_hh"])

                            if pd.notna(
                                row["village_hh"]
                            )
                            else 0,

                        "google_maps_link":
                            google_maps_link,

                        "color":
                            route_color,

                        "stroke":
                            route_color,

                        "stroke-width":
                            ROUTE_STROKE_WIDTH,

                        "stroke-opacity":
                            0.85
                    },

                    "geometry":
                        mapping(line)
                }

                features.append(feature)

                # ==========================================
                # ARROW / POINTER AT VILLAGE END
                # ==========================================

                bearing = compute_bearing(
                    curve_coords[-2],
                    curve_coords[-1]
                )

                arrow_point = Point(
                    destination
                )

                arrow_feature = {

                    "type": "Feature",

                    "properties": {

                        "feature_type":
                            "arrow",

                        "block_name":
                            str(block_name),

                        "route_code":
                            str(route_code),

                        "route_name":
                            route_name,

                        "route_village":
                            str(row["route_village"]),

                        "color":
                            route_color,

                        "bearing":
                            round(bearing, 1)
                    },

                    "geometry":
                        mapping(arrow_point)
                }

                features.append(arrow_feature)

            except Exception as e:

                print(
                    f"Route Line Error "
                    f"({block_name} / {route_code}): {e}"
                )

        legend_entries.append({

            "block_name": str(block_name),
            "route_code": str(route_code),
            "route_name": route_name,
            "color": route_color,
            "village_count": total_villages
        })

    return features, legend_entries



# GENERATE MULTI BLOCK ROUTES GEOJSON


def generate_routes_geojson(block_codes):

    conn = get_connection()

    query = """
    EXEC usp_get_routes_by_block_code_new ?
    """

    df = pd.read_sql(

        query,
        conn,

        params=[
            block_codes
        ]
    )

    conn.close()



    if df.empty:

        return {

            "type":
                "FeatureCollection",

            "features":
                [],

            "legend":
                []
        }

   
   
    # NORMALIZE COLUMNS

    df.columns = [

        c.lower().strip()
        for c in df.columns
    ]

    print("\n========== RAW DATA ==========")

    print(
        df.head()
    )


    # PROCESS EACH BLOCK INDEPENDENTLY
   
    all_features = []

    all_legend_entries = []

    for block_name, df_block in df.groupby("block_name"):

        print(
            f"\nProcessing Block: {block_name}"
        )

        features, legend_entries = generate_block_routes(

            df_block.copy(),
            block_name
        )

        all_features.extend(features)

        all_legend_entries.extend(legend_entries)


    # FINAL GEOJSON

    geojson = {

        "type":
            "FeatureCollection",

        "features":
            all_features,

        "legend":
            all_legend_entries
    }

    return geojson