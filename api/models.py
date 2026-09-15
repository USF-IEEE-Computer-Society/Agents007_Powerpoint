"""Request and response shapes for the resume kit API."""

from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ExperienceIn(BaseModel):
    role: str = Field(min_length=1)
    company: str = Field(min_length=1)
    location: str = ""
    startDate: str = Field(min_length=1)
    endDate: str = ""
    current: bool = False
    description: str = ""


class Experience(ExperienceIn):
    id: UUID = Field(default_factory=uuid4)


class JobIn(BaseModel):
    title: str = Field(min_length=1)
    company: str = Field(min_length=1)
    link: str = ""
    description: str = Field(min_length=1)


class Job(JobIn):
    id: UUID = Field(default_factory=uuid4)
    savedAt: datetime


class TailorIn(BaseModel):
    jobDescription: str = Field(min_length=1)
    # How many experiences may make the cut. The model returns fewer when
    # fewer genuinely fit.
    maxExperiences: int = Field(default=4, ge=1, le=10)


class SelectedIn(BaseModel):
    experienceId: str
    role: str
    company: str
    whyChosen: str = ""
    bullets: list[str]


class NotSelectedIn(BaseModel):
    experienceId: str
    role: str
    company: str


class TailoredIn(BaseModel):
    """A result the browser already has, sent back to be rendered as a PDF."""

    generatedAt: str
    consideredCount: int = 0
    selected: list[SelectedIn]
    notSelected: list[NotSelectedIn] = []
