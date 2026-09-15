"""LangChain chain that turns saved experiences into bullets for one posting.

Reads every experience the student has saved, hands them to Claude along with
the job description, and gets back resume bullets grouped by experience.
"""

import os
from datetime import datetime, timezone

from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

# Haiku 4.5 is the cheapest current model: $1/$5 per million tokens in/out.
# A run here is roughly 2K in / 600 out, so well under a cent. Override with
# ANTHROPIC_MODEL in api/.env if you ever want to spend more for quality.
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-haiku-4-5")

# The rule that matters most. Rewriting how work is described is the job;
# inventing work is resume fraud, and a student would be taking that into an
# interview. It is stated as a hard constraint and repeated in the user turn.
SYSTEM_PROMPT = """You write resume bullets for university students applying to \
technical roles. You are helping a member of IEEE-CS at USF tailor what they \
have already done to one specific posting.

Work only from what the student actually wrote. You may:
- reframe their wording to match the language of the posting
- lead with the part of the work the posting cares about
- tighten phrasing into strong resume bullets, each starting with a past-tense
  verb (present tense for a role they still hold)

You must never:
- invent metrics, numbers, percentages, team sizes, or outcomes they did not state
- add technologies, tools, or responsibilities they did not mention
- claim seniority, ownership, or impact beyond what their description supports

If an experience says little, write fewer bullets rather than padding it. If an \
experience is genuinely irrelevant to this posting, still include it with its \
strongest honest bullet - the student decides what to drop, not you.

Write 2-4 bullets per experience. No trailing periods. No first-person pronouns."""

USER_PROMPT = """Here is the job description:

<job_description>
{job_description}
</job_description>

Here are the student's saved experiences:

<experiences>
{experiences}
</experiences>

Write tailored bullets for each experience, working only from what the student \
wrote. Invent nothing."""


class ExperienceBullets(BaseModel):
    """Bullets for one of the student's experiences."""

    experienceId: str = Field(description="The id of the experience, copied exactly")
    role: str = Field(description="The student's role, copied exactly")
    company: str = Field(description="The organization, copied exactly")
    bullets: list[str] = Field(description="2-4 resume bullets tailored to the posting")


class TailoredResume(BaseModel):
    """Every experience, rewritten for one posting."""

    experiences: list[ExperienceBullets]


def _format_experiences(records: list[dict]) -> str:
    """Render the experiences as a block the model can read cleanly."""
    blocks = []
    for r in records:
        dates = f"{r['start_date']} to {'present' if r['current'] else r['end_date']}"
        blocks.append(
            f"<experience id=\"{r['id']}\">\n"
            f"Role: {r['role']}\n"
            f"Organization: {r['company']}\n"
            f"Location: {r['location'] or 'not given'}\n"
            f"Dates: {dates}\n"
            f"What they wrote: {r['description'] or 'no description given'}\n"
            f"</experience>"
        )
    return "\n\n".join(blocks)


def build_chain():
    """Wire the prompt to Claude with the output schema enforced.

    Built per request rather than at import time so a missing API key surfaces
    as a handled error on the endpoint, not a crash on startup.
    """
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to api/.env or export it "
            "before starting the API."
        )

    # The output is a few bullets per experience — 4000 is generous. This is
    # a ceiling, not a spend: billing is on tokens actually produced.
    model = ChatAnthropic(model=MODEL, max_tokens=4000)
    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM_PROMPT), ("human", USER_PROMPT)]
    )
    # with_structured_output binds the schema as a tool, so the shape is
    # enforced by the API rather than by parsing whatever prose comes back.
    return prompt | model.with_structured_output(TailoredResume)


def tailor(job_description: str, records: list[dict]) -> dict:
    """Run the chain and return the payload the frontend downloads."""
    chain = build_chain()
    result: TailoredResume = chain.invoke(
        {
            "job_description": job_description,
            "experiences": _format_experiences(records),
        }
    )
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "model": MODEL,
        "experiences": [e.model_dump() for e in result.experiences],
    }
