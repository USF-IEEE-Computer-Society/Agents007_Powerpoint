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
