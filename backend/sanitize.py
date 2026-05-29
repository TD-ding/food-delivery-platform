from markupsafe import escape


def sanitize_text(text):
    if not text:
        return text
    return str(escape(text))


def sanitize_dict(data, fields):
    for field in fields:
        if field in data and isinstance(data[field], str):
            data[field] = sanitize_text(data[field])
    return data
