import pandas as pd
import numpy as np
import alphashape
from app.config import settings
from scipy.spatial import Voronoi, cKDTree
import pyodbc

from shapely.geometry import (
    Polygon,
    mapping,
    MultiPoint,
    MultiPolygon,
    LineString,
    Point
)
from shapely.ops import unary_union
from shapely.affinity import scale


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


# FIX INFINITE VORONOI POLYGONS

def voronoi_finite_polygons_2d(
    vor,
    radius=None
):

    if vor.points.shape[1] != 2:

        raise ValueError(
            "Requires 2D input"
        )

    new_regions = []

    new_vertices = (
        vor.vertices.tolist()
    )

    center = vor.points.mean(
        axis=0
    )

    if radius is None:

        radius = np.ptp(
            vor.points,
            axis=0
        ).max()

    all_ridges = {}

    for (p1, p2), (v1, v2) in zip(

        vor.ridge_points,
        vor.ridge_vertices
    ):

        all_ridges.setdefault(
            p1,
            []
        ).append(
            (p2, v1, v2)
        )

        all_ridges.setdefault(
            p2,
            []
        ).append(
            (p1, v1, v2)
        )

    for p1, region in enumerate(
        vor.point_region
    ):

        vertices = vor.regions[
            region
        ]

        # finite region
        if all(v >= 0 for v in vertices):

            new_regions.append(
                vertices
            )

            continue

        ridges = all_ridges.get(
            p1,
            []
        )

        new_region = [

            v for v in vertices
            if v >= 0
        ]

        for p2, v1, v2 in ridges:

            if v2 < 0:
                v1, v2 = v2, v1

            if v1 >= 0:
                continue

            t = (

                vor.points[p2]
                - vor.points[p1]
            )

            t /= np.linalg.norm(t)

            n = np.array([
                -t[1],
                t[0]
            ])

            midpoint = vor.points[
                [p1, p2]
            ].mean(axis=0)

            direction = np.sign(

                np.dot(
                    midpoint - center,
                    n
                )

            ) * n

            far_point = (

                vor.vertices[v2]
                + direction * radius
            )

            new_region.append(
                len(new_vertices)
            )

            new_vertices.append(
                far_point.tolist()
            )

        vs = np.asarray([

            new_vertices[v]
            for v in new_region
        ])

        c = vs.mean(axis=0)

        angles = np.arctan2(

            vs[:, 1] - c[1],
            vs[:, 0] - c[0]
        )

        new_region = np.array(
            new_region
        )[np.argsort(angles)]

        new_regions.append(
            new_region.tolist()
        )

    return (

        new_regions,
        np.asarray(new_vertices)
    )


# SMOOTH POLYGON BOUNDARIES (CURVED)
# Chaikin's corner-cutting algorithm

def smooth_polygon_chaikin(
    polygon,
    iterations=3
):
    """
    Applies Chaikin's corner-cutting smoothing
    to a Shapely Polygon for organic curved look.
    Works on both exterior and interior rings.
    """

    def chaikin_smooth(coords, iters):

        pts = np.array(coords)

        # close the ring if not already closed
        if not np.allclose(pts[0], pts[-1]):
            pts = np.vstack([pts, pts[0]])

        for _ in range(iters):

            new_pts = []

            n = len(pts) - 1  # last == first (closed)

            for i in range(n):

                p0 = pts[i]
                p1 = pts[i + 1]

                q = 0.75 * p0 + 0.25 * p1
                r = 0.25 * p0 + 0.75 * p1

                new_pts.append(q)
                new_pts.append(r)

            new_pts.append(new_pts[0])  # close ring

            pts = np.array(new_pts)

        return pts

    if polygon.is_empty or not polygon.is_valid:
        return polygon

    try:

        ext_coords = list(
            polygon.exterior.coords
        )

        smoothed_ext = chaikin_smooth(
            ext_coords,
            iterations
        )

        smoothed_interiors = []

        for interior in polygon.interiors:

            int_coords = list(interior.coords)

            smoothed_int = chaikin_smooth(
                int_coords,
                iterations
            )

            if len(smoothed_int) >= 4:

                smoothed_interiors.append(
                    smoothed_int.tolist()
                )

        result = Polygon(
            smoothed_ext,
            smoothed_interiors
        )

        if result.is_valid and not result.is_empty:
            return result

        return polygon

    except Exception:
        return polygon


# ==========================================
# LLOYD'S RELAXATION
# Moves each seed point to the centroid of
# its Voronoi cell to equalise cell sizes
# ==========================================

def lloyd_relaxation(
    points,
    boundary,
    iterations=3
):
    """
    Iteratively moves seed points toward their
    Voronoi cell centroids within the boundary,
    producing more uniform polygon areas.
    """

    pts = points.copy()

    for _ in range(iterations):

        if len(pts) < 4:
            break

        try:

            vor = Voronoi(pts)

            regions, vertices = (
                voronoi_finite_polygons_2d(vor)
            )

            new_pts = []

            for region in regions:

                try:

                    poly = Polygon(
                        vertices[region]
                    ).intersection(boundary)

                    if (
                        not poly.is_empty
                        and poly.geom_type in (
                            "Polygon",
                            "MultiPolygon"
                        )
                    ):

                        centroid = poly.centroid

                        new_pts.append([
                            centroid.x,
                            centroid.y
                        ])

                    else:

                        # fallback: keep original
                        new_pts.append(pts[
                            len(new_pts)
                        ].tolist())

                except Exception:

                    new_pts.append(pts[
                        len(new_pts)
                    ].tolist())

            if len(new_pts) == len(pts):
                pts = np.array(new_pts)

        except Exception:
            break

    return pts


# COMPUTE BLOCK CENTROID

def get_block_centroid(df):

    return np.array([
        df["village_lng"].median(),
        df["village_lat"].median()
    ])


# ==========================================
# COMPUTE MIN DISTANCE BETWEEN BLOCKS
# Returns minimum distance in degrees between
# any pair of block centroids
# ==========================================

def compute_min_block_distance(
    block_centroids
):
    """
    Given a list of (lng, lat) centroids,
    returns the minimum pairwise distance
    in degrees between any two blocks.
    """

    if len(block_centroids) < 2:
        return float("inf")

    centroids = np.array(block_centroids)

    min_dist = float("inf")

    for i in range(len(centroids)):
        for j in range(i + 1, len(centroids)):

            dist = np.linalg.norm(
                centroids[i] - centroids[j]
            )

            if dist < min_dist:
                min_dist = dist

    return min_dist


# CLEAN BLOCK DATA

def clean_block_dataframe(df):

    # CONVERT LAT/LNG

    df["village_lat"] = pd.to_numeric(

        df["village_lat"],
        errors="coerce"
    )

    df["village_lng"] = pd.to_numeric(

        df["village_lng"],
        errors="coerce"
    )

    # REMOVE NULLS

    df = df.dropna(

        subset=[
            "village_lat",
            "village_lng"
        ]
    )

    # REMOVE DUPLICATES — keep first occurrence

    df = df.drop_duplicates(

        subset=[
            "village_lat",
            "village_lng"
        ],

        keep="first"
    )

    # VALID RANGE

    df = df[

        (df["village_lat"] >= 15) &
        (df["village_lat"] <= 35) &

        (df["village_lng"] >= 65) &
        (df["village_lng"] <= 95)
    ]

    return df


# REMOVE SPATIAL BLOCK OUTLIERS 

def remove_outlier_villages(
    df,
    z_threshold=2.5
):
    """
    Removes villages whose lat or lng deviates
    more than threshold standard deviations
    from the block's mean position.
    Stricter than IQR — catches distant outliers.
    """

    if len(df) < 4:
        return df

    for col in ["village_lat", "village_lng"]:

        mean = df[col].mean()
        std = df[col].std()

        if std == 0:
            continue

        z_scores = np.abs(
            (df[col] - mean) / std
        )

        df = df[z_scores <= z_threshold]

    # centroid distance filter

    if len(df) < 4:
        return df

    centroid_lng = df["village_lng"].median()
    centroid_lat = df["village_lat"].median()

    distances = np.sqrt(

        (df["village_lng"] - centroid_lng) ** 2 +
        (df["village_lat"] - centroid_lat) ** 2
    )

    median_dist = distances.median()

    # allow up to 3x the median distance
    # (handles irregular block shapes)
    max_allowed = median_dist * 3.0

    # ensure a sensible minimum floor
    max_allowed = max(max_allowed, 0.1)

    df = df[distances <= max_allowed]

    return df


# ==========================================
# SCALE POINTS TOWARD CENTROID
# Used when blocks are too close together —
# shrinks the point cloud so boundaries
# don't overlap neighbouring blocks
# ==========================================

def scale_points_toward_centroid(
    points,
    scale_factor
):
    """
    Contracts all points toward their centroid
    by the given scale_factor (0 < factor <= 1).
    """

    centroid = points.mean(axis=0)

    scaled = centroid + (
        points - centroid
    ) * scale_factor

    return scaled


# SCALE FACTOR FROM BLOCK DISTANCE

def get_scale_factor_from_distance(
    min_dist,
    threshold_close=1.0,
    threshold_very_close=0.4
):
    """
    Returns a scale factor between 0.5 and 1.0
    based on how close neighbouring blocks are.

    - min_dist >= threshold_close   → no scaling (1.0)
    - min_dist <= threshold_v_close → max shrink (0.5)
    - between                       → linear interpolation
    """

    if min_dist >= threshold_close:
        return 1.0

    if min_dist <= threshold_very_close:
        return 0.50

    # linear interpolation
    t = (
        (min_dist - threshold_very_close) /
        (threshold_close - threshold_very_close)
    )

    return 0.50 + t * 0.50


# BUILD ALIGNED BOUNDARY

def build_aligned_boundary(
    village_polygons,
    smooth_iterations=3
):
    """
    Merges all village polygons into a single
    union, then smooths the outer hull to
    produce an organic, village-aligned boundary.
    """

    if not village_polygons:
        return None

    try:

        union = unary_union(village_polygons)

        if union.is_empty:
            return None

        # take outer hull to fill interior gaps
        boundary = union.convex_hull

        # small buffer 
        # to create a slightly padded, rounded edge
        boundary = boundary.buffer(0.005)

        boundary = smooth_polygon_chaikin(
            boundary,
            iterations=smooth_iterations
        )

        # slight inward shrink 
        boundary = boundary.buffer(-0.002)

        if (
            boundary.is_empty
            or not boundary.is_valid
        ):

            boundary = union.convex_hull.buffer(
                0.005
            )

        return boundary

    except Exception:
        return None


# GENERATE SINGLE BLOCK VORONOI

def generate_block_voronoi(
    df,
    block_name,
    scale_factor=1.0
):

    df = clean_block_dataframe(df)


    # REMOVE OUTLIER VILLAGES

    df = remove_outlier_villages(df)

    print(
        f"\n========== {block_name} =========="
    )

    print(
        f"Cleaned Row Count: {len(df)}"
    )

    # MINIMUM POINTS CHECK

    if len(df) < 4:

        return []

    points = df[
        ["village_lng", "village_lat"]
    ].values.astype(np.float64)

    # SCALE POINTS WHEN BLOCKS ARE CLOSE

    if scale_factor < 1.0:

        points = scale_points_toward_centroid(
            points,
            scale_factor
        )

        # update df to reflect new coordinates
        df = df.copy()

        df["village_lng"] = points[:, 0]

        df["village_lat"] = points[:, 1]

    # CREATE INITIAL BOUNDARY FOR RELAXATION

    PADDING = 0.008

    try:

        alpha_val = 0.5

        init_boundary = alphashape.alphashape(
            points,
            alpha_val
        )

        if (
            init_boundary.is_empty or
            init_boundary.geom_type not in (
                "Polygon",
                "MultiPolygon"
            )
        ):
            raise ValueError("Invalid alphashape")

    except Exception:

        init_boundary = MultiPoint(
            points
        ).convex_hull

    init_boundary = init_boundary.buffer(
        PADDING
    )

    # LLOYD'S RELAXATION

    relaxed_points = lloyd_relaxation(
        points,
        init_boundary,
        iterations=2
    )

    # FINAL VORONOI ON RELAXED POINTS
    try:

        vor = Voronoi(relaxed_points)

        regions, vertices = (
            voronoi_finite_polygons_2d(vor)
        )

    except Exception as e:

        print(
            f"Voronoi Error ({block_name}): {e}"
        )

        return []

    features = []

    village_polygons = []  # collect for boundary

    # CREATE POLYGONS
    for row_index, region in zip(
        df.index,
        regions
    ):

        try:

            polygon = Polygon(
                vertices[region]
            )

            polygon = polygon.intersection(
                init_boundary
            )

            if polygon.is_empty:
                continue

            # POLYGON (CURVED BOUNDARIES)

            polygon = smooth_polygon_chaikin(
                polygon,
                iterations=3
            )

            if polygon.is_empty or not polygon.is_valid:
                continue

            village_polygons.append(polygon)

            row = df.loc[row_index]

            feature = {

                "type": "Feature",

                "properties": {

                    "block_name":
                        str(block_name),

                    "vatika_code":

                        int(row["vatika_code"])

                        if pd.notna(
                            row["vatika_code"]
                        )
                        else 0,

                    "vatika_name":
                        str(
                            row["vatika_name"]
                        ),

                    "village_name":
                        str(
                            row["village_name"]
                        ),

                    "households":

                        int(row["households"])

                        if pd.notna(
                            row["households"]
                        )
                        else 0,

                    "is_physical":

                        int(row["is_physical"])

                        if pd.notna(
                            row["is_physical"]
                        )
                        else 0
                },

                "geometry":
                    mapping(polygon)
            }

            features.append(
                feature
            )

        except Exception as e:

            print(
                f"Polygon Error ({block_name}): {e}"
            )

    # ==========================================
    # CREATE ALIGNED BOUNDARY FEATURE (OUTER BOUNDARY)
    # Built from actual village polygon union
    # ==========================================

    aligned_boundary = build_aligned_boundary(
        village_polygons,
        smooth_iterations=3
    )

    if aligned_boundary is None:

        # fallback to init boundary
        aligned_boundary = init_boundary

    boundary_feature = {

        "type": "Feature",

        "properties": {

            "feature_type":
                "boundary",

            "block_name":
                str(block_name)
        },

        "geometry":
            mapping(aligned_boundary)
    }

    features.append(
        boundary_feature
    )

    return features


# GENERATE MULTI BLOCK GEOJSON

def generate_voronoi_geojson(
    block_codes
):

    conn = get_connection()

    query = """
    EXEC usp_select_vatika_villages_by_block ?
    """

    df = pd.read_sql(

        query,
        conn,

        params=[
            block_codes
        ]
    )

    conn.close()

    # EMPTY CHECK

    if df.empty:

        return {

            "type":
                "FeatureCollection",

            "features":
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

    # CLEAN EACH BLOCK & COMPUTE CENTROIDS

    grouped = df.groupby("block_name")

    block_centroids = []

    cleaned_groups = {}

    for block_name, df_block in grouped:

        df_clean = clean_block_dataframe(
            df_block.copy()
        )

        df_clean = remove_outlier_villages(
            df_clean
        )

        if len(df_clean) >= 4:

            centroid = get_block_centroid(
                df_clean
            )

            block_centroids.append(centroid)

            cleaned_groups[block_name] = df_clean

    # COMPUTE MIN BLOCK DISTANCE
    # & DETERMINE SCALE FACTOR

    min_dist = compute_min_block_distance(
        block_centroids
    )

    scale_factor = get_scale_factor_from_distance(
        min_dist
    )

    print(
        f"\n========== BLOCK DISTANCE ANALYSIS =========="
    )

    print(
        f"Min Block Distance (degrees): {min_dist:.4f}"
    )

    print(
        f"Scale Factor Applied: {scale_factor:.2f}"
    )

    # GENERATE PER-BLOCK VORONOI

    all_features = []

    for block_name, df_block in cleaned_groups.items():

        print(
            f"\nProcessing Block: {block_name}"
        )

        features = generate_block_voronoi(

            df_block.copy(),
            block_name,
            scale_factor=scale_factor
        )

        all_features.extend(
            features
        )

    # FINAL GEOJSON

    geojson = {

        "type":
            "FeatureCollection",

        "features":
            all_features
    }

    return geojson