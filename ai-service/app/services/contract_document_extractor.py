import re
import time
from typing import List, Tuple
from app.schemas.intelligence import ExtractedRequirementItem, DocumentExtractionResponse

EXTRACTOR_VERSION = "1.0.0"

# Domain Patterns for Infrastructure Work Packages & Requirements
DOMAIN_SPECS = [
    {
        "pattern": r"(asphalt|bitumen|wearing\s+course|dense\s+bituminous).*?(thickness|depth).*?(\d+[\.\d]*)\s*(mm|cm)",
        "work_package": "Road Resurfacing & Pavement",
        "title": "Minimum Asphalt Wearing Course Thickness",
        "category": "DIMENSIONAL",
        "unit": "mm",
        "tolerance": "± 2 mm (IRC:SP:84 Standard)",
        "requires_physical_measurement": True,
        "verification_method": "PHYSICAL_MEASUREMENT",
        "criteria": "Thickness verified via calibrated core extraction or calibrated depth gauge record prior to surface compaction.",
    },
    {
        "pattern": r"(trench|excavation).*?(depth|deep).*?(\d+[\.\d]*)\s*(m|meter|cm)",
        "work_package": "Trenching & Utility Ducting",
        "title": "Excavation Trench Depth Specification",
        "category": "DIMENSIONAL",
        "unit": "meter",
        "tolerance": "± 0.05 m",
        "requires_physical_measurement": True,
        "verification_method": "PHYSICAL_MEASUREMENT",
        "criteria": "Excavation trench depth must satisfy municipal utility setback standards before pipe/duct laying.",
    },
    {
        "pattern": r"(compaction|proctor|mdd).*?(\d+[\.\d]*)\s*%",
        "work_package": "Sub-Base & Compaction",
        "title": "Modified Proctor Soil Compaction Density",
        "category": "MATERIAL_QUALITY",
        "unit": "percentage",
        "tolerance": "Min 95% of Maximum Dry Density",
        "requires_physical_measurement": True,
        "verification_method": "LAB_REPORT_VERIFICATION",
        "criteria": "Sub-base soil compaction must achieve certified nuclear gauge or sand replacement test approval.",
    },
    {
        "pattern": r"(barricade|safety\s+barrier|retroreflective|cone).*?(install|mandatory|require)",
        "work_package": "Site Safety & Public Protection",
        "title": "Continuous Retroreflective Safety Barricading",
        "category": "SAFETY_RULE",
        "unit": "boolean",
        "tolerance": "Zero Deviation during Active Work",
        "requires_physical_measurement": False,
        "verification_method": "PHOTO_EVIDENCE",
        "criteria": "High-visibility Class-IV retroreflective barriers and warning signage stationed around the perimeter.",
    },
    {
        "pattern": r"(curing|concrete\s+curing).*?(\d+)\s*(days|hours)",
        "work_package": "Concrete & Structural Works",
        "title": "Minimum Wet Curing Duration",
        "category": "SPECIFICATION",
        "unit": "days",
        "tolerance": "Continuous moist curing",
        "requires_physical_measurement": False,
        "verification_method": "PHOTO_EVIDENCE",
        "criteria": "Continuous water sprinkling or approved curing compound application documented across the prescribed duration.",
    },
    {
        "pattern": r"(hdpe\s+duct|fiber\s+duct|conduit).*?(\d+[\.\d]*)\s*(mm|inch)",
        "work_package": "Optical Fiber & Utility Corridors",
        "title": "HDPE Cable Duct Diameter Specification",
        "category": "SPECIFICATION",
        "unit": "mm",
        "tolerance": "Standard Telecom Grade Schedule 40",
        "requires_physical_measurement": False,
        "verification_method": "PHOTO_EVIDENCE",
        "criteria": "Ducts must be visually undamaged, properly coupled, and seated in fine sand bedding.",
    },
    {
        "pattern": r"(slope|gradient|fall).*?(\d+[\.\d]*)\s*%",
        "work_package": "Stormwater Drainage & Grading",
        "title": "Surface Drainage Runoff Gradient",
        "category": "TOLERANCE",
        "unit": "percentage",
        "tolerance": "± 0.25% longitudinal gradient",
        "requires_physical_measurement": True,
        "verification_method": "PHYSICAL_MEASUREMENT",
        "criteria": "Finished road camber/slope verified with digital slope level to prevent surface ponding.",
    },
]


def extract_requirements_from_text(
    text_content: str, filename: str = "contract.pdf"
) -> DocumentExtractionResponse:
    start_time = time.time()
    clean_text = text_content.replace("\r\n", "\n").strip()
    preview = clean_text[:400] + ("..." if len(clean_text) > 400 else "")

    detected_type = "CIVIL_INFRASTRUCTURE"
    lower_text = clean_text.lower()
    if "road" in lower_text or "asphalt" in lower_text or "bituminous" in lower_text:
        detected_type = "ROAD_WORKS"
    elif "fiber" in lower_text or "telecom" in lower_text or "duct" in lower_text:
        detected_type = "OPTICAL_FIBER"
    elif "water" in lower_text or "drainage" in lower_text or "pipe" in lower_text:
        detected_type = "WATER_SUPPLY_DRAINAGE"

    requirements: List[ExtractedRequirementItem] = []
    matched_patterns = set()

    # 1. Apply Domain Regex Specifications against document
    for spec in DOMAIN_SPECS:
        matches = list(re.finditer(spec["pattern"], lower_text))
        if matches:
            matched_patterns.add(spec["title"])
            match = matches[0]
            val = match.group(3) if len(match.groups()) >= 3 else "Satisfied"
            unit = spec.get("unit", "")

            req = ExtractedRequirementItem(
                work_package=spec["work_package"],
                title=spec["title"],
                description=f"Specification extracted from {filename}: Requirement demands {val} {unit} adherence under {spec['tolerance']}.",
                category=spec["category"],
                acceptance_criteria=spec["criteria"],
                measurement_unit=unit,
                required_value=val,
                permitted_tolerance=spec["tolerance"],
                mandatory=True,
                requires_human_inspection=True,
                requires_physical_measurement=spec["requires_physical_measurement"],
                verification_method=spec["verification_method"],
            )
            requirements.append(req)

    # 2. Extract numbered clauses / BOQ items (e.g. "Item 1.1", "Clause 4.2", "Section 3:")
    clause_matches = re.findall(
        r"(?:clause|section|item|specification)\s+([0-9\.\-]+)[\:\-\s]+([^\n\.\;]{15,180})",
        clean_text,
        re.IGNORECASE,
    )

    for clause_num, clause_desc in clause_matches[:6]:
        clause_desc_clean = clause_desc.strip()
        if any(clause_desc_clean.lower() in r.title.lower() for r in requirements):
            continue

        req = ExtractedRequirementItem(
            work_package=f"General Civil (Clause {clause_num})",
            title=f"Contractual Compliance: {clause_desc_clean[:60]}",
            description=f"Extracted contractual requirement from clause {clause_num}: {clause_desc_clean}.",
            category="SPECIFICATION",
            acceptance_criteria=f"Field execution must strictly conform to quality guidelines outlined in Clause {clause_num}.",
            measurement_unit="standard",
            required_value="100%",
            permitted_tolerance="Full conformance",
            mandatory=True,
            requires_human_inspection=True,
            requires_physical_measurement="thickness" in clause_desc_clean.lower()
            or "depth" in clause_desc_clean.lower(),
            verification_method=(
                "PHYSICAL_MEASUREMENT"
                if ("thickness" in clause_desc_clean.lower() or "depth" in clause_desc_clean.lower())
                else "PHOTO_EVIDENCE"
            ),
        )
        requirements.append(req)

    # 3. Fallback defaults if document was concise/free-form
    if not requirements:
        requirements.append(
            ExtractedRequirementItem(
                work_package="Civil Works General",
                title="Pavement Surface Uniformity & Quality",
                description="Surface must be smooth, uniform, and free of visible cracks, ruts, or depressions.",
                category="SPECIFICATION",
                acceptance_criteria="No visual surface distress observed upon high-resolution photo inspection.",
                measurement_unit="visual",
                required_value="Uniform",
                permitted_tolerance="Zero visible defect clusters",
                mandatory=True,
                requires_human_inspection=True,
                requires_physical_measurement=False,
                verification_method="PHOTO_EVIDENCE",
            )
        )
        requirements.append(
            ExtractedRequirementItem(
                work_package="Civil Works General",
                title="Excavation Depth and Sub-grade Conformance",
                description="Trench depth must strictly match the project engineering drawing profile.",
                category="DIMENSIONAL",
                acceptance_criteria="Physical measurement record signed by authorized field inspector.",
                measurement_unit="meter",
                required_value="1.20",
                permitted_tolerance="± 0.05 m",
                mandatory=True,
                requires_human_inspection=True,
                requires_physical_measurement=True,
                verification_method="PHYSICAL_MEASUREMENT",
            )
        )

    duration_ms = int((time.time() - start_time) * 1000)
    return DocumentExtractionResponse(
        status="SUCCESS",
        document_name=filename,
        detected_contract_type=detected_type,
        total_requirements_extracted=len(requirements),
        extracted_text_preview=preview,
        requirements=requirements,
        extraction_duration_ms=duration_ms,
        extractor_version=EXTRACTOR_VERSION,
    )
