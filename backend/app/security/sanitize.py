"""HTML sanitization using nh3 (Rust-based)."""
import nh3

_ALLOWED_TAGS = {
    "p", "br", "strong", "em", "b", "i", "u", "s",
    "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote", "pre", "code", "sub", "sup", "table", "thead",
    "tbody", "tr", "th", "td", "span", "div",
}
_ALLOWED_ATTRIBUTES = {
    "a": {"href", "title", "target"},
    "span": {"class"},
    "div": {"class"},
    "td": {"colspan", "rowspan"},
    "th": {"colspan", "rowspan"},
}


def sanitize_html(html: str) -> str:
    """Sanitize HTML input, stripping dangerous tags and attributes."""
    if not html:
        return html
    return nh3.clean(
        html,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRIBUTES,
        link_rel=None,
        url_schemes={"http", "https", "mailto"},
    )
