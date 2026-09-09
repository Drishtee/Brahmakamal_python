import colorsys
import math

import numpy as np
import pandas as pd
import pyodbc

from app.config import settings

from shapely.geometry import LineString, Point, mapping


# =====================================================
# DB CONNECTION
# =====================================================

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


# =====================================================
# LINE STYLE
# =====================================================

BASE_STROKE_WIDTH = 2.0

STROKE_WIDTH_MULTIPLIER = 1.15

ROUTE_STROKE_WIDTH = round(
    BASE_STROKE_WIDTH *
    STROKE_WIDTH_MULTIPLIER,
    2
)


# =====================================================
# CURVE STYLE
# =====================================================

CURVE_BOW_RATIO = 0.18

CURVE_RESOLUTION = 24


# =====================================================
# CLEAN PHYSICAL ROUTE DATA
# =====================================================

def clean_physical_route_dataframe(df):

    # ---------------------------------------------
    # CONVERT LAT/LNG TO NUMERIC
    # ---------------------------------------------

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


    # ---------------------------------------------
    # REMOVE NULL COORDINATES
    # ---------------------------------------------

    df = df.dropna(
        subset=[
            "block_lat",
            "block_lng",
            "route_village_lat",
            "route_village_lng"
        ]
    )


    # ---------------------------------------------
    # REMOVE DUPLICATE ROUTE LEGS
    # ---------------------------------------------

    df = df.drop_duplicates(
        subset=[
            "route_code",
            "route_village_lat",
            "route_village_lng"
        ],
        keep="first"
    )


    # ---------------------------------------------
    # VALID INDIA COORDINATE RANGE
    # ---------------------------------------------

    df = df[
        (df["route_village_lat"] >= 15) &
        (df["route_village_lat"] <= 35) &
        (df["route_village_lng"] >= 65) &
        (df["route_village_lng"] <= 95)
    ]


    return df


# =====================================================
# REMOVE OUT-OF-BOUND VILLAGES
# =====================================================

def remove_out_of_bound_villages(
    df,
    k=2.5,
    min_radius=0.05
):
    """
    For a single block's rows, calculate the
    distance of each route village from the block.

    Villages that are statistical distance outliers
    are removed.

    Threshold:

        median + k * MAD
    """

    if len(df) < 2:
        return df


    block_lat = df[
        "block_lat"
    ].iloc[0]

    block_lng = df[
        "block_lng"
    ].iloc[0]


    distances = np.sqrt(

        (
            df["route_village_lng"] -
            block_lng
        ) ** 2

        +

        (
            df["route_village_lat"] -
            block_lat
        ) ** 2

    )


    median_dist = distances.median()


    mad = (
        distances -
        median_dist
    ).abs().median()


    if mad == 0:

        mad = (
            median_dist * 0.5
            if median_dist > 0
            else min_radius
        )


    dynamic_bound = (
        median_dist +
        k * mad
    )


    dynamic_bound = max(
        dynamic_bound,
        min_radius
    )


    df = df[
        distances <= dynamic_bound
    ]


    return df


# =====================================================
# DYNAMIC ROUTE COLOURS
# =====================================================

GOLDEN_ANGLE = 0.6180339887498949


def generate_route_color(seed_index):

    hue = (
        seed_index *
        GOLDEN_ANGLE
    ) % 1.0


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


def build_route_color_map(
    route_codes
):

    sorted_codes = sorted(
        route_codes,
        key=lambda c: str(c)
    )


    return {

        code:
            generate_route_color(
                idx
            )

        for idx, code in enumerate(
            sorted_codes
        )

    }


# =====================================================
# BUILD CURVED LINE
# =====================================================

def build_curved_line(
    origin,
    destination,
    bow_ratio=CURVE_BOW_RATIO,
    resolution=CURVE_RESOLUTION
):
    """
    Creates a quadratic Bezier curve between
    the block and route village.

    Coordinates are:

        (longitude, latitude)
    """

    ox, oy = origin

    dx, dy = destination


    vx = dx - ox

    vy = dy - oy


    length = math.hypot(
        vx,
        vy
    )


    if length == 0:

        return [
            origin,
            destination
        ]


    # ---------------------------------------------
    # Perpendicular unit vector
    # ---------------------------------------------

    px = vy / length

    py = -vx / length


    bow = (
        length *
        bow_ratio
    )


    midx = (
        (ox + dx) / 2.0
        +
        px * bow
    )


    midy = (
        (oy + dy) / 2.0
        +
        py * bow
    )


    coords = []


    # ---------------------------------------------
    # Quadratic Bezier
    # ---------------------------------------------

    for i in range(
        resolution + 1
    ):

        t = (
            i /
            resolution
        )


        one_minus_t = 1 - t


        x = (

            (one_minus_t ** 2)
            * ox

            +

            2 *
            one_minus_t *
            t *
            midx

            +

            (t ** 2)
            * dx

        )


        y = (

            (one_minus_t ** 2)
            * oy

            +

            2 *
            one_minus_t *
            t *
            midy

            +

            (t ** 2)
            * dy

        )


        coords.append(
            (x, y)
        )


    return coords


# =====================================================
# COMPUTE BEARING
# =====================================================

def compute_bearing(
    p_from,
    p_to
):

    lng1, lat1 = p_from

    lng2, lat2 = p_to


    d_lng = math.radians(
        lng2 - lng1
    )


    lat1_rad = math.radians(
        lat1
    )

    lat2_rad = math.radians(
        lat2
    )


    x = (
        math.sin(d_lng)
        *
        math.cos(lat2_rad)
    )


    y = (

        math.cos(lat1_rad)
        *
        math.sin(lat2_rad)

        -

        math.sin(lat1_rad)
        *
        math.cos(lat2_rad)
        *
        math.cos(d_lng)

    )


    bearing = math.degrees(
        math.atan2(
            x,
            y
        )
    )


    return (
        bearing + 360
    ) % 360


# =====================================================
# GENERATE PHYSICAL ROUTES FOR ONE BLOCK
# =====================================================

def generate_block_physical_routes(
    df,
    block_name
):

    df = clean_physical_route_dataframe(
        df
    )


    df = remove_out_of_bound_villages(
        df
    )


    print(
        f"\n========== PHYSICAL ROUTES: {block_name} =========="
    )

    print(
        f"Cleaned Row Count: {len(df)}"
    )


    if df.empty:

        return [], []


    color_map = build_route_color_map(

        df[
            "route_code"
        ].unique().tolist()

    )


    features = []

    legend_entries = []


    # =================================================
    # ONE LINE PER ROUTE / VILLAGE LEG
    # =================================================

    for route_code, route_df in df.groupby(
        "route_code"
    ):

        route_color = color_map[
            route_code
        ]


        route_name = str(
            route_df[
                "route_name"
            ].iloc[0]
        )


        google_maps_link = str(
            route_df[
                "googlemapslink"
            ].iloc[0]
        )


        total_villages = len(
            route_df
        )


        for _, row in route_df.iterrows():

            try:

                # -------------------------------------
                # BLOCK ORIGIN
                # -------------------------------------

                origin = (

                    row[
                        "block_lng"
                    ],

                    row[
                        "block_lat"
                    ]

                )


                # -------------------------------------
                # VILLAGE DESTINATION
                # -------------------------------------

                destination = (

                    row[
                        "route_village_lng"
                    ],

                    row[
                        "route_village_lat"
                    ]

                )


                if origin == destination:

                    continue


                # -------------------------------------
                # CURVED ROUTE
                # -------------------------------------

                curve_coords = build_curved_line(

                    origin,

                    destination

                )


                line = LineString(
                    curve_coords
                )


                # -------------------------------------
                # LINE FEATURE
                # -------------------------------------

                feature = {

                    "type":
                        "Feature",

                    "properties": {

                        "feature_type":
                            "physical_route",

                        "block_name":
                            str(
                                block_name
                            ),

                        "route_code":
                            str(
                                route_code
                            ),

                        "route_name":
                            route_name,

                        "route_village":
                            str(
                                row[
                                    "route_village"
                                ]
                            ),

                        "village_hh":

                            int(
                                row[
                                    "village_hh"
                                ]
                            )

                            if pd.notna(
                                row[
                                    "village_hh"
                                ]
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
                        mapping(
                            line
                        )

                }


                features.append(
                    feature
                )


                # =================================================
                # VILLAGE-END ARROW / POINT
                # =================================================

                bearing = compute_bearing(

                    curve_coords[-2],

                    curve_coords[-1]

                )


                arrow_point = Point(
                    destination
                )


                arrow_feature = {

                    "type":
                        "Feature",

                    "properties": {

                        "feature_type":
                            "physical_route_arrow",

                        "block_name":
                            str(
                                block_name
                            ),

                        "route_code":
                            str(
                                route_code
                            ),

                        "route_name":
                            route_name,

                        "route_village":
                            str(
                                row[
                                    "route_village"
                                ]
                            ),

                        "color":
                            route_color,

                        "bearing":
                            round(
                                bearing,
                                1
                            )

                    },

                    "geometry":
                        mapping(
                            arrow_point
                        )

                }


                features.append(
                    arrow_feature
                )


            except Exception as e:

                print(

                    f"Physical Route Line Error "
                    f"({block_name} / "
                    f"{route_code}): {e}"

                )


        # =================================================
        # LEGEND
        # =================================================

        legend_entries.append({

            "block_name":
                str(
                    block_name
                ),

            "route_code":
                str(
                    route_code
                ),

            "route_name":
                route_name,

            "color":
                route_color,

            "village_count":
                total_villages

        })


    return (
        features,
        legend_entries
    )


# =====================================================
# GENERATE MULTI-BLOCK PHYSICAL ROUTES GEOJSON
# =====================================================

def generate_physical_routes_geojson(
    block_codes
):

    conn = get_connection()


    query = """
        EXEC usp_get_physical_routes_by_block_code_new ?
    """


    df = pd.read_sql(
        query,
        conn,
        params=[
            block_codes
        ]
    )


    conn.close()


    # =================================================
    # EMPTY RESPONSE
    # =================================================

    if df.empty:

        return {

            "type":
                "FeatureCollection",

            "features":
                [],

            "legend":
                []

        }


    # =================================================
    # NORMALIZE COLUMN NAMES
    # =================================================

    df.columns = [

        c.lower().strip()

        for c in df.columns

    ]


    print(
        "\n========== RAW PHYSICAL ROUTE DATA =========="
    )

    print(
        df.head()
    )


    # =================================================
    # PROCESS EACH BLOCK
    # =================================================

    all_features = []

    all_legend_entries = []


    for block_name, df_block in df.groupby(
        "block_name"
    ):

        print(
            f"\nProcessing Physical Route Block: "
            f"{block_name}"
        )


        features, legend_entries = (
            generate_block_physical_routes(

                df_block.copy(),

                block_name

            )
        )


        all_features.extend(
            features
        )

        all_legend_entries.extend(
            legend_entries
        )


    # =================================================
    # FINAL GEOJSON
    # =================================================

    geojson = {

        "type":
            "FeatureCollection",

        "features":
            all_features,

        "legend":
            all_legend_entries

    }


    return geojson