#!/usr/bin/env python3
"""Create fillable Hideaway invoice template PDFs.

Prerequisite:
  pnpm tsx scripts/render-fillable-invoice-template-source.ts

Dependencies:
  python3 -m pip install -r scripts/requirements-pdf.txt

The source PDFs keep the canonical pdfmake header, footer, typography,
spacing, and legal copy. This script only masks the values that should be
editable and places AcroForm text fields over those masks.
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
import re
from typing import Iterable

import pdfplumber
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject,
    BooleanObject,
    DictionaryObject,
    FloatObject,
    NameObject,
    NumberObject,
    TextStringObject,
)
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
TMP_DIR = ROOT / "tmp" / "pdfs"
OUT_DIR = ROOT / "output" / "pdf"

SOURCES = {
    "en": Path("/tmp/fillable-invoice-source-en.pdf"),
    "ko": Path("/tmp/fillable-invoice-source-ko.pdf"),
}
OUTPUTS = {
    "en": OUT_DIR / "hideaway-invoice-template-fillable-en.pdf",
    "ko": OUT_DIR / "hideaway-invoice-template-fillable-ko.pdf",
}

TEXT_RGB = "0.102 0.086 0.071 rg"
WHITE = (1, 1, 1)
MULTILINE = 1 << 12


@dataclass(frozen=True)
class Field:
    page_index: int
    name: str
    value: str
    x: float
    y: float
    width: float
    height: float
    font: str = "TiRo"
    font_size: float = 9
    align: int = 0
    multiline: bool = False
    patch_pad: float = 1.2

    @property
    def rect(self) -> tuple[float, float, float, float]:
        return (self.x, self.y, self.x + self.width, self.y + self.height)

    @property
    def patch_rect(self) -> tuple[float, float, float, float]:
        return (
            self.x - self.patch_pad,
            self.y - self.patch_pad,
            self.width + self.patch_pad * 2,
            self.height + self.patch_pad * 2,
        )


def font_resource(base_font: str) -> DictionaryObject:
    return DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject(f"/{base_font}"),
            NameObject("/Encoding"): NameObject("/WinAnsiEncoding"),
        }
    )


def make_widget(field: Field) -> DictionaryObject:
    flags = MULTILINE if field.multiline else 0
    return DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Annot"),
            NameObject("/Subtype"): NameObject("/Widget"),
            NameObject("/FT"): NameObject("/Tx"),
            NameObject("/T"): TextStringObject(field.name),
            NameObject("/V"): TextStringObject(field.value),
            NameObject("/DV"): TextStringObject(field.value),
            NameObject("/Rect"): ArrayObject(
                [FloatObject(value) for value in field.rect]
            ),
            NameObject("/F"): NumberObject(4),
            NameObject("/Ff"): NumberObject(flags),
            NameObject("/Q"): NumberObject(field.align),
            NameObject("/DA"): TextStringObject(
                f"/{field.font} {field.font_size:g} Tf {TEXT_RGB}"
            ),
            NameObject("/MK"): DictionaryObject(
                {
                    NameObject("/BG"): ArrayObject(
                        [FloatObject(value) for value in WHITE]
                    ),
                    NameObject("/BC"): ArrayObject(
                        [FloatObject(value) for value in WHITE]
                    ),
                }
            ),
            NameObject("/BS"): DictionaryObject({NameObject("/W"): NumberObject(0)}),
        }
    )


def create_patch_overlay(
    page_size: tuple[float, float], fields: Iterable[Field]
) -> PdfReader:
    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=page_size)
    c.setFillColorRGB(*WHITE)
    for field in fields:
        x, y, width, height = field.patch_rect
        c.rect(x, y, width, height, stroke=0, fill=1)
    c.save()
    packet.seek(0)
    return PdfReader(packet)


def words_for(source: Path) -> list[list[dict[str, float | str]]]:
    with pdfplumber.open(source) as pdf:
        return [
            page.extract_words(
                x_tolerance=1,
                y_tolerance=3,
                keep_blank_chars=False,
            )
            for page in pdf.pages
        ]


def first_word(
    pages: list[list[dict[str, float | str]]],
    text: str,
    *,
    page_index: int | None = None,
    min_top: float | None = None,
) -> tuple[int, dict[str, float | str]]:
    indexes = range(len(pages)) if page_index is None else [page_index]
    for index in indexes:
        for word in pages[index]:
            if word["text"] != text:
                continue
            if min_top is not None and float(word["top"]) < min_top:
                continue
            return index, word
    raise ValueError(f"Could not find text token {text!r}")


def last_word(
    pages: list[list[dict[str, float | str]]], text: str
) -> tuple[int, dict[str, float | str]]:
    found: tuple[int, dict[str, float | str]] | None = None
    for index, words in enumerate(pages):
        for word in words:
            if word["text"] == text:
                found = (index, word)
    if found is None:
        raise ValueError(f"Could not find text token {text!r}")
    return found


def row_y(page_height: float, word: dict[str, float | str]) -> float:
    return page_height - float(word["bottom"]) - 1.0


def field_from_word(
    pages: list[list[dict[str, float | str]]],
    page_height: float,
    token: str,
    name: str,
    value: str,
    *,
    x: float | None = None,
    width: float | None = None,
    height: float = 13,
    align: int = 0,
    font: str = "TiRo",
    font_size: float = 9,
    page_index: int | None = None,
) -> Field:
    found_page, word = first_word(pages, token, page_index=page_index)
    field_x = float(word["x0"]) - 1 if x is None else x
    field_width = (
        float(word["x1"]) - float(word["x0"]) + 4 if width is None else width
    )
    return Field(
        page_index=found_page,
        name=name,
        value=value,
        x=field_x,
        y=row_y(page_height, word),
        width=field_width,
        height=height,
        font=font,
        font_size=font_size,
        align=align,
    )


def line_item_fields(
    pages: list[list[dict[str, float | str]]], page_height: float, locale: str
) -> list[Field]:
    fields: list[Field] = []
    page_index, q02 = first_word(pages, "Q02")
    _, amt02 = first_word(pages, "AMT02", page_index=page_index)
    _, tax02 = first_word(pages, "TAX02", page_index=page_index)

    qty_x = float(q02["x0"]) - 8
    amount_x = float(amt02["x0"]) - 12
    tax_x = float(tax02["x0"]) - 8
    qty_w = min(32, max(22, amount_x - qty_x - 6))
    amount_w = max(42, tax_x - amount_x - 6)
    tax_w = 46
    desc_x = 48
    desc_w = max(260, qty_x - desc_x - 18)

    first_page, first_desc = first_word(pages, "Annual")
    item_rows: list[tuple[int, dict[str, float | str], str, str, str, str]] = [
        (first_page, first_desc, "Annual Membership", "1", "90,000", "0")
    ]
    placeholders: list[tuple[int, int, dict[str, float | str]]] = []
    for page, words in enumerate(pages):
        for word in words:
            match = re.fullmatch(r"ITEM(\d{2})DESC", str(word["text"]))
            if match:
                placeholders.append((int(match.group(1)), page, word))
    for _, page, word in sorted(placeholders):
        item_rows.append((page, word, "", "", "", ""))

    for row, (page, word, desc, qty, amount, tax) in enumerate(item_rows, start=1):
        y = row_y(page_height, word)
        fields.extend(
            [
                Field(
                    page,
                    f"item_{row}_description",
                    desc,
                    desc_x,
                    y,
                    desc_w,
                    13,
                    font="TiBo" if row == 1 else "TiRo",
                    font_size=9,
                ),
                Field(
                    page,
                    f"item_{row}_quantity",
                    qty,
                    qty_x,
                    y,
                    qty_w,
                    13,
                    align=2,
                    patch_pad=6,
                ),
                Field(
                    page,
                    f"item_{row}_total",
                    amount,
                    amount_x,
                    y,
                    amount_w,
                    13,
                    align=2,
                    patch_pad=6,
                ),
                Field(
                    page,
                    f"item_{row}_tax",
                    tax,
                    tax_x,
                    y,
                    tax_w,
                    13,
                    align=2,
                    patch_pad=6,
                ),
            ]
        )
    return fields


def total_fields(
    pages: list[list[dict[str, float | str]]], page_height: float, locale: str
) -> list[Field]:
    labels = {
        "en": [
            ("Subtotal", "subtotal", "90,000"),
            ("Tax", "tax", "0"),
            ("Total", "total", "90,000"),
        ],
        "ko": [
            ("소계", "subtotal", "90,000"),
            ("부가세", "tax", "0"),
            ("합계", "total", "90,000"),
        ],
    }[locale]
    fields: list[Field] = []
    for label, key, value in labels:
        page, word = last_word(pages, label)
        fields.append(
            Field(
                page,
                f"totals_{key}",
                value,
                500,
                row_y(page_height, word),
                48,
                13,
                font="TiBo" if key == "total" else "TiRo",
                align=2,
            )
        )
    return fields


def payment_fields(
    pages: list[list[dict[str, float | str]]], page_height: float, locale: str
) -> list[Field]:
    fields: list[Field] = []
    if locale == "en":
        page, bank_word = first_word(pages, "Bank")
        first_y = row_y(page_height, bank_word)
        fields.append(
            Field(
                page,
                "payment_1_method",
                "Bank transfer",
                float(bank_word["x0"]) - 3,
                first_y,
                76,
                13,
            )
        )
    else:
        page, bank_word = first_word(pages, "계좌이체")
        first_y = row_y(page_height, bank_word)

    amount_token = "90,000"
    amount_page, amount_word = first_word(pages, amount_token, page_index=page)
    fields.append(
        Field(
            amount_page,
            "payment_1_amount",
            "90,000",
            float(amount_word["x1"]) - 58,
            first_y,
            58,
            13,
            align=2,
        )
    )
    date_token = "Apr" if locale == "en" else "2026년"
    date_page, date_word = first_word(pages, date_token, page_index=page)
    fields.append(
        Field(
            date_page,
            "payment_1_date",
            "April 28, 2026" if locale == "en" else "2026. 4. 28.",
            float(date_word["x0"]) - 2,
            first_y,
            82,
            13,
        )
    )
    ref_page, ref_word = first_word(pages, "KB-2026-0428-9F2A", page_index=page)
    fields.append(
        Field(
            ref_page,
            "payment_1_reference",
            "KB-2026-0428-9F2A",
            float(ref_word["x0"]) - 2,
            first_y,
            112,
            13,
        )
    )

    for row in range(2, 5):
        token = f"PAYMETHOD{row:02d}"
        method_page, method_word = first_word(pages, token)
        y = row_y(page_height, method_word)
        fields.append(
            Field(
                method_page,
                f"payment_{row}_method",
                "",
                float(method_word["x0"]) - 3,
                y,
                100,
                13,
            )
        )
        amount_value = f"{row},{str(row) * 3}"
        amount_page, amount_word = first_word(
            pages, amount_value, page_index=method_page
        )
        fields.append(
            Field(
                amount_page,
                f"payment_{row}_amount",
                "",
                float(amount_word["x1"]) - 58,
                y,
                58,
                13,
                align=2,
            )
        )
        date_page, date_word = first_word(
            pages, f"DATE{row:02d}", page_index=method_page
        )
        fields.append(
            Field(
                date_page,
                f"payment_{row}_date",
                "",
                float(date_word["x0"]) - 2,
                y,
                82,
                13,
            )
        )
        ref_page, ref_word = first_word(
            pages, f"REF{row:02d}", page_index=method_page
        )
        fields.append(
            Field(
                ref_page,
                f"payment_{row}_reference",
                "",
                float(ref_word["x0"]) - 2,
                y,
                112,
                13,
            )
        )
    return fields


def fixed_fields(
    pages: list[list[dict[str, float | str]]], page_height: float, locale: str
) -> list[Field]:
    fields: list[Field] = []
    if locale == "en":
        fields.append(
            field_from_word(
                pages,
                page_height,
                "April",
                "issued_date",
                "April 28, 2026",
                x=475,
                width=72,
                align=2,
                page_index=0,
            )
        )
    fields.extend(
        [
            field_from_word(
                pages,
                page_height,
                "Sean",
                "client_name",
                "Sean Choi",
                x=48,
                width=180,
                font="TiBo",
                page_index=0,
            ),
            field_from_word(
                pages,
                page_height,
                "seanschoi@lostinseoul.com",
                "client_email",
                "seanschoi@lostinseoul.com",
                x=48,
                width=190,
                page_index=0,
            ),
            field_from_word(
                pages,
                page_height,
                "hideawayseoul.com/@sean",
                "client_profile",
                "hideawayseoul.com/@sean",
                x=48,
                width=190,
                page_index=0,
            ),
            field_from_word(
                pages,
                page_height,
                "0001024",
                "invoice_number",
                "0001024",
                width=80,
                page_index=0,
            ),
            field_from_word(
                pages,
                page_height,
                "KB-2026-0428-9F2A",
                "order_number",
                "KB-2026-0428-9F2A",
                width=125,
                page_index=0,
            ),
        ]
    )
    if locale == "en":
        fields.append(
            field_from_word(
                pages,
                page_height,
                "Member",
                "member_since",
                "Member Since 2026",
                x=48,
                width=190,
                page_index=0,
            )
        )

    return fields


def build_fields(source: Path, locale: str, page_height: float) -> list[Field]:
    pages = words_for(source)
    return [
        *fixed_fields(pages, page_height, locale),
        *line_item_fields(pages, page_height, locale),
        *total_fields(pages, page_height, locale),
        *payment_fields(pages, page_height, locale),
    ]


def add_acroform(writer: PdfWriter, fields: list[Field]) -> None:
    field_refs = ArrayObject()
    for field in fields:
        widget = make_widget(field)
        widget_ref = writer._add_object(widget)
        page = writer.pages[field.page_index]
        annots = page.get(NameObject("/Annots"))
        if annots is None:
            annots = ArrayObject()
            page[NameObject("/Annots")] = annots
        annots.append(widget_ref)
        field_refs.append(widget_ref)

    ti_ro = writer._add_object(font_resource("Times-Roman"))
    ti_bo = writer._add_object(font_resource("Times-Bold"))
    acroform = DictionaryObject(
        {
            NameObject("/Fields"): field_refs,
            NameObject("/NeedAppearances"): BooleanObject(True),
            NameObject("/DA"): TextStringObject(f"/TiRo 9 Tf {TEXT_RGB}"),
            NameObject("/DR"): DictionaryObject(
                {
                    NameObject("/Font"): DictionaryObject(
                        {
                            NameObject("/TiRo"): ti_ro,
                            NameObject("/TiBo"): ti_bo,
                        }
                    )
                }
            ),
        }
    )
    writer._root_object.update({NameObject("/AcroForm"): acroform})


def build(locale: str) -> Path:
    source = SOURCES[locale]
    output = OUTPUTS[locale]
    if not source.exists():
        raise FileNotFoundError(
            f"{source} not found. Run "
            "pnpm tsx scripts/render-fillable-invoice-template-source.ts first."
        )

    reader = PdfReader(source)
    writer = PdfWriter()
    first_page = reader.pages[0]
    page_width = float(first_page.mediabox.width)
    page_height = float(first_page.mediabox.height)
    fields = build_fields(source, locale, page_height)

    by_page: dict[int, list[Field]] = {}
    for field in fields:
        by_page.setdefault(field.page_index, []).append(field)

    for index, page in enumerate(reader.pages):
        page_fields = by_page.get(index, [])
        if page_fields:
            overlay = create_patch_overlay((page_width, page_height), page_fields)
            page.merge_page(overlay.pages[0])
        writer.add_page(page)

    add_acroform(writer, fields)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as handle:
        writer.write(handle)
    return output


def main() -> None:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    for locale in ("en", "ko"):
        output = build(locale)
        print(f"ok {locale} -> {output}")


if __name__ == "__main__":
    main()
