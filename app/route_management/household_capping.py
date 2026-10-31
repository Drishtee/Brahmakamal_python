from app.geo.service import get_connection

DEFAULT_MIN_HOUSEHOLDS = 7500
DEFAULT_MAX_HOUSEHOLDS = 10000

def get_block_household_capping(block_code):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            EXEC dbo.usp_get_block_household_capping
                @BlockCode = ?
            """,
            block_code
        )

        row = cursor.fetchone()

        if not row:
            return {
                "block_code": block_code,
                "min_households": DEFAULT_MIN_HOUSEHOLDS,
                "max_households": DEFAULT_MAX_HOUSEHOLDS
            }

        return {
            "block_code": row[0],
            "min_households": int(row[1]),
            "max_households": int(row[2])
        }

    finally:
        cursor.close()
        conn.close()
