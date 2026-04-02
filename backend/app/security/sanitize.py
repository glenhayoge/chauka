"""HTML sanitization for rich text fields stored in the database."""
import re

# Pattern to strip script/style/iframe tags entirely
_DANGEROUS_TAGS = re.compile(
    r'<(script|style|iframe|object|embed|form|input|button)\b[^>]*>.*?</\1>',
    re.IGNORECASE | re.DOTALL,
)
_SELF_CLOSING_DANGEROUS = re.compile(
    r'<(script|style|iframe|object|embed|input|button)\b[^>]*/?>',
    re.IGNORECASE,
)
_DANGEROUS_ATTR = re.compile(
    r'\s*(on\w+|javascript|data)\s*=\s*["\'][^"\']*["\']',
    re.IGNORECASE,
)


def sanitize_html(html: str) -> str:
    """
    Basic server-side HTML sanitization for rich text fields.

    For production, replace with the `nh3` library:
        import nh3
        return nh3.clean(html, tags=ALLOWED_TAGS)
    """
    if not html:
        return html
    html = _DANGEROUS_TAGS.sub("", html)
    html = _SELF_CLOSING_DANGEROUS.sub("", html)
    html = _DANGEROUS_ATTR.sub("", html)
    html = re.sub(r'href\s*=\s*["\']javascript:[^"\']*["\']', 'href="#"', html, flags=re.IGNORECASE)
    return html.strip()
