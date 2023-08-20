from typing import List


def get_initial_page_text(
    item_license: str,
    description: str,
    date_created: str,
    source: str,
    author: str,
    location: dict,
    categories: List[str] = None,
) -> str:
    """
    Function used to generate wiki text for the page of the uploaded image
    """
    description = f"|description={description}\n"
    date_created = f"|date={date_created}\n"
    source = f"|source={source}\n"
    author = f"|author={author}\n"
    location_string = ""

    if not categories:
        categories_string = ""
    else:
        formatted_category_list = [f"[[{category}]]" for category in categories]
        categories_string = "\n".join(formatted_category_list)

    if location.get("latitude") and location.get("longitude"):
        latitude = f"|1={location['latitude']}\n"
        longitude = f"|2={location['longitude']}\n"
        if heading := location.get("heading"):
            heading = f"|3=heading:{heading}\n"

        location_string = f"{{{{Location{latitude}{longitude}{heading}}}}}"

    return (
        f"=={{{{int:filedesc}}}}==\n"
        f"{{{{Information\n"
        f"{description}{date_created}{source}{author}\n"
        f"}}}}\n"
        f"{location_string}\n"
        f"\n"
        f"=={{{{int:license-header}}}}==\n"
        f"{{{{{item_license}}}}}\n"
        f"\n"
        f"{categories_string}\n"
    )
