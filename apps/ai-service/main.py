from __future__ import annotations

import hashlib
import io
import re
from datetime import datetime
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageChops, ImageFilter, ImageStat, UnidentifiedImageError
from pydantic import BaseModel

try:
    import pytesseract
except ImportError:  # OCR stays optional in minimal deployments.
    pytesseract = None


app = FastAPI(title="Ledgerly Receipt Intelligence", version="0.1.0")
MAX_FILE_SIZE = 10 * 1024 * 1024
SUPPORTED_TYPES = {"image/jpeg", "image/png", "application/pdf"}
seen_hashes: dict[str, int] = {}


class Flag(BaseModel):
    type: str
    classification: str
    score: float
    details: dict[str, Any]


class ReceiptAnalysis(BaseModel):
    extracted: dict[str, Any]
    ocrConfidence: float
    verificationConfidence: float
    decision: str
    reason: str
    recommendation: str
    imageHash: str
    flags: list[Flag]


def extract_fields(text: str) -> dict[str, Any]:
    amount_matches = re.findall(r"(?:₹|INR|Rs\.?|TOTAL)\s*[:₹]?\s*([0-9,]+(?:\.\d{2})?)", text, re.IGNORECASE)
    date_matches = re.findall(r"\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b", text)
    invoice_matches = re.findall(r"(?:invoice|bill|receipt)\s*(?:no|number|#)?\s*[:#-]?\s*([A-Z0-9/-]{4,})", text, re.IGNORECASE)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return {
        "merchant": lines[0][:120] if lines else None,
        "amount": amount_matches[-1].replace(",", "") if amount_matches else None,
        "date": date_matches[0] if date_matches else None,
        "invoiceNumber": invoice_matches[0] if invoice_matches else None,
        "rawText": text[:5000],
    }


def image_signals(data: bytes) -> tuple[dict[str, Any], list[Flag], float]:
    flags: list[Flag] = []
    with Image.open(io.BytesIO(data)) as image:
        image.load()
        width, height = image.size
        grayscale = image.convert("L")
        sharpness = ImageStat.Stat(grayscale.filter(ImageFilter.FIND_EDGES)).var[0]
        quality_score = min(1.0, (width * height) / 1_500_000) * min(1.0, sharpness / 850)
        if width < 700 or height < 700 or sharpness < 70:
            flags.append(Flag(
                type="IMAGE_QUALITY", classification="REVIEW", score=round(1 - quality_score, 3),
                details={"reason": "The receipt may be too small or blurred for reliable verification.", "width": width, "height": height},
            ))

        software = str(image.getexif().get(305, "")).lower()
        editing_tools = [name for name in ("photoshop", "gimp", "canva", "lightroom", "snapseed") if name in software]

        ela_score = 0.0
        if image.format == "JPEG":
            recompressed = io.BytesIO()
            image.convert("RGB").save(recompressed, format="JPEG", quality=90)
            with Image.open(io.BytesIO(recompressed.getvalue())) as rebuilt:
                difference = ImageChops.difference(image.convert("RGB"), rebuilt.convert("RGB"))
                ela_score = sum(ImageStat.Stat(difference).mean) / (3 * 255)

        tamper_score = min(0.99, (0.58 if editing_tools else 0.0) + min(0.4, ela_score * 7))
        if tamper_score >= 0.42:
            flags.append(Flag(
                type="EDITED_RECEIPT", classification="POSSIBLE_FAKE", score=round(tamper_score, 3),
                details={
                    "reason": "Editing metadata or inconsistent JPEG compression was detected.",
                    "editingSoftware": software or None,
                    "elaScore": round(ela_score, 4),
                },
            ))

        text = ""
        if pytesseract is not None:
            try:
                text = pytesseract.image_to_string(image)
            except Exception:
                text = ""
        return extract_fields(text), flags, quality_score


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "receipt-intelligence", "time": datetime.utcnow().isoformat()}


@app.post("/analyze", response_model=ReceiptAnalysis)
async def analyze(file: UploadFile = File(...)) -> ReceiptAnalysis:
    if file.content_type not in SUPPORTED_TYPES:
        raise HTTPException(status_code=415, detail="Only JPG, PNG, and PDF receipts are supported.")
    data = await file.read(MAX_FILE_SIZE + 1)
    if not data or len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Receipt must be between 1 byte and 10 MB.")

    digest = hashlib.sha256(data).hexdigest()
    flags: list[Flag] = []
    extracted: dict[str, Any] = {"merchant": None, "amount": None, "date": None, "invoiceNumber": None, "rawText": ""}
    quality_score = 0.72

    if file.content_type.startswith("image/"):
        try:
            extracted, flags, quality_score = image_signals(data)
        except UnidentifiedImageError as error:
            raise HTTPException(status_code=422, detail="The uploaded image is not a valid receipt file.") from error

    previous = seen_hashes.get(digest, 0)
    seen_hashes[digest] = previous + 1
    if previous:
        flags.append(Flag(
            type="DUPLICATE_RECEIPT", classification="DUPLICATE", score=1.0,
            details={"reason": "This exact file was analyzed previously.", "previousMatches": previous},
        ))

    missing = [key for key in ("merchant", "amount", "date") if not extracted.get(key)]
    if missing:
        flags.append(Flag(
            type="MISSING_INFORMATION", classification="REVIEW", score=min(1.0, len(missing) / 3),
            details={"reason": "Required receipt fields could not be read.", "fields": missing},
        ))

    highest_risk = max((flag.score for flag in flags if flag.type in {"EDITED_RECEIPT", "DUPLICATE_RECEIPT"}), default=0.0)
    decision = "REVIEW" if highest_risk >= 0.42 or len(missing) >= 2 else "PASS"
    reason = "Receipt needs human review because one or more risk signals were found." if decision == "REVIEW" else "No material receipt risk signals were found."
    recommendation = "Compare the receipt with the card transaction and request the original file if needed." if decision == "REVIEW" else "Continue with policy validation."
    ocr_confidence = max(0.15, min(0.98, quality_score * (1 - len(missing) * 0.18)))
    verification_confidence = min(0.99, 0.7 + abs(highest_risk - 0.5) * 0.5)
    return ReceiptAnalysis(
        extracted=extracted, ocrConfidence=round(ocr_confidence, 3),
        verificationConfidence=round(verification_confidence, 3), decision=decision,
        reason=reason, recommendation=recommendation, imageHash=digest, flags=flags,
    )
