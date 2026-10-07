from app.geo.service import get_connection


def check_csp_access(email):

    if not email:
        return False

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT 1
            FROM dbo.TblCSPAccess
            WHERE Email = ?
              AND IsActive = 1
            """,
            email.strip()
        )

        result = cursor.fetchone()

        return result is not None

    finally:
        cursor.close()
        conn.close()


def has_csp_access(email):

    if not email:
        return False

    return check_csp_access(email)