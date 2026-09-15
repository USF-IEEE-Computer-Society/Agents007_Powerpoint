"""A LangGraph agent that writes resume bullets and checks its own work.

This is the part of the workshop that shows what LangGraph adds over a plain
LangChain chain. A chain is a straight line: prompt in, answer out. This graph
has a *cycle* — it drafts bullets, criticises them, and sends them back to be
rewritten if the critic finds the model invented something.

    select ──▶ write ──▶ critique ──▶ (clean?) ──▶ END
                 ▲                        │
                 └──────── revise ────────┘

Three nodes, one conditional edge, a revision cap so it cannot loop forever.
State is a TypedDict that every node reads from and writes to.
"""

import os
from datetime import datetime, timezone
from typing import Annotated, Literal, TypedDict

from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-haiku-4-5")

# How many times the critic may send the bullets back. Two is enough in
# practice and keeps a runaway loop from burning credit.
MAX_REVISIONS = 2


# ---------------------------------------------------------------- state ----


def _last(_existing, new):
    """Reducer: later writes win. The default for every field here."""
    return new


class AgentState(TypedDict):
    """Everything the graph carries between nodes.

    Each node returns a partial dict; LangGraph merges it into this state and
    hands the result to the next node.
    """

    job_description: str
    records: list[dict]
    max_experiences: int

    selected: Annotated[list[dict], _last]  # chosen experiences, with reasons
    drafts: Annotated[list[dict], _last]  # bullets per experience
    issues: Annotated[list[dict], _last]  # what the critic caught
    revisions: Annotated[int, _last]  # how many times we have looped
    trace: Annotated[list[dict], _last]  # human-readable log for the UI


# --------------------------------------------------------------- schemas ----


class Pick(BaseModel):
    experienceId: str = Field(description="The id, copied exactly")
    whyChosen: str = Field(description="One short line on why it earns a place")


class Selection(BaseModel):
    picks: list[Pick] = Field(description="Chosen experiences, strongest first")


class DraftedExperience(BaseModel):
    experienceId: str = Field(description="The id, copied exactly")
    bullets: list[str] = Field(description="2-4 resume bullets")


class Drafts(BaseModel):
    drafts: list[DraftedExperience]


class Issue(BaseModel):
    experienceId: str = Field(description="The id the problem bullet belongs to")
    bullet: str = Field(description="The bullet as written")
    problem: str = Field(description="What it claims that the source does not say")


class Critique(BaseModel):
    issues: list[Issue] = Field(
        description="Only bullets that claim something the student did not write"
    )


def _model():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to api/.env or export it "
            "before starting the API."
        )
    return ChatAnthropic(model=MODEL, max_tokens=4000)


def _render(records: list[dict]) -> str:
    return "\n\n".join(
        f'<experience id="{r["id"]}">\n'
        f"Role: {r['role']}\n"
        f"Organization: {r['company']}\n"
        f"Dates: {r['start_date']} to {'present' if r['current'] else r['end_date']}\n"
        f"What they wrote: {r['description'] or 'no description given'}\n"
        f"</experience>"
        for r in records
    )


# ----------------------------------------------------------------- nodes ----

SELECT_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You choose which of a student's experiences belong on a resume for one "
     "specific job. A resume is short. Pick only what genuinely strengthens "
     "this application, strongest first, and leave the rest out. Do not fill "
     "to the limit — if only two fit, pick two. Judge on how the work matches "
     "the posting, not on how impressive the title sounds."),
    ("human",
     "<job_description>\n{job_description}\n</job_description>\n\n"
     "<experiences>\n{experiences}\n</experiences>\n\n"
     "Pick at most {max_experiences}. Copy each id exactly."),
])

WRITE_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You write resume bullets for a university student.\n\n"
     "Work ONLY from what the student actually wrote. You may reframe their "
     "wording toward the posting and tighten phrasing. You must never invent "
     "metrics, numbers, technologies, tools, responsibilities, or outcomes "
     "they did not state, and never claim impact their description does not "
     "support.\n\n"
     "2-4 bullets each, starting with a past-tense verb (present tense if they "
     "still hold the role). No trailing periods. No first-person pronouns."),
    ("human",
     "<job_description>\n{job_description}\n</job_description>\n\n"
     "<experiences>\n{experiences}\n</experiences>\n\n"
     "Write bullets for each experience listed above.{feedback}"),
])

CRITIQUE_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You check resume bullets against the source text the student wrote, and "
     "you are the last thing standing between a student and a claim they "
     "cannot defend in an interview.\n\n"
     "Flag a bullet ONLY if it asserts something the source does not support: "
     "a number, metric, technology, tool, scale, or outcome that is not there, "
     "or a level of ownership the source does not claim. Rewording, "
     "reordering, and tightening are fine and must NOT be flagged. Matching "
     "the posting's vocabulary for something the student genuinely did is "
     "fine.\n\n"
     "If every bullet is supported, return an empty list. Do not invent work "
     "for yourself."),
    ("human",
     "<source_experiences>\n{experiences}\n</source_experiences>\n\n"
     "<bullets_to_check>\n{drafts}\n</bullets_to_check>\n\n"
     "Which bullets claim something the source does not support?"),
])


def select_node(state: AgentState) -> dict:
    """Pick which experiences belong on this resume."""
    result = (SELECT_PROMPT | _model().with_structured_output(Selection)).invoke({
        "job_description": state["job_description"],
        "experiences": _render(state["records"]),
        "max_experiences": state["max_experiences"],
    })

    # Drop any pick naming an id that is not in the database. A model can
    # invent one; a student must never see an experience they did not save.
    by_id = {str(r["id"]): r for r in state["records"]}
    selected = [
        {
            "experienceId": p.experienceId,
            "role": by_id[p.experienceId]["role"],
            "company": by_id[p.experienceId]["company"],
            "whyChosen": p.whyChosen,
        }
        for p in result.picks
        if p.experienceId in by_id
    ][: state["max_experiences"]]

    return {
        "selected": selected,
        "revisions": 0,
        "issues": [],
        "trace": state.get("trace", [])
        + [{
            "node": "select",
            "detail": f"Chose {len(selected)} of {len(state['records'])} experiences",
        }],
    }


def write_node(state: AgentState) -> dict:
    """Draft bullets — or redraft them using the critic's feedback."""
    chosen_ids = {s["experienceId"] for s in state["selected"]}
    chosen = [r for r in state["records"] if str(r["id"]) in chosen_ids]

    feedback = ""
    if state.get("issues"):
        problems = "\n".join(
            f"- In experience {i['experienceId']}, this bullet is not supported "
            f"by the source: \"{i['bullet']}\" — {i['problem']}"
            for i in state["issues"]
        )
        feedback = (
            "\n\nA reviewer rejected these bullets from your previous attempt:\n"
            f"{problems}\n\nRewrite them so every claim traces back to what the "
            "student wrote. Drop the unsupported detail rather than softening it. "
            "Keep the bullets that were not flagged."
        )

    result = (WRITE_PROMPT | _model().with_structured_output(Drafts)).invoke({
        "job_description": state["job_description"],
        "experiences": _render(chosen),
        "feedback": feedback,
    })

    drafts = [
        {"experienceId": d.experienceId, "bullets": d.bullets}
        for d in result.drafts
        if d.experienceId in chosen_ids
    ]
    revisions = state.get("revisions", 0)
    detail = (
        f"Rewrote bullets addressing {len(state['issues'])} issue(s)"
        if state.get("issues")
        else f"Drafted bullets for {len(drafts)} experiences"
    )
    return {
        "drafts": drafts,
        "revisions": revisions + (1 if state.get("issues") else 0),
        "trace": state.get("trace", []) + [{"node": "write", "detail": detail}],
    }


def critique_node(state: AgentState) -> dict:
    """Check every bullet against the source. This is the guardrail."""
    chosen_ids = {s["experienceId"] for s in state["selected"]}
    chosen = [r for r in state["records"] if str(r["id"]) in chosen_ids]

    rendered = "\n\n".join(
        f'<bullets id="{d["experienceId"]}">\n'
        + "\n".join(f"- {b}" for b in d["bullets"])
        + "\n</bullets>"
        for d in state["drafts"]
    )

    result = (CRITIQUE_PROMPT | _model().with_structured_output(Critique)).invoke({
        "experiences": _render(chosen),
        "drafts": rendered,
    })

    issues = [i.model_dump() for i in result.issues if i.experienceId in chosen_ids]
    detail = (
        "Every bullet is supported by the source"
        if not issues
        else f"Found {len(issues)} unsupported claim(s)"
    )
    return {
        "issues": issues,
        "trace": state.get("trace", []) + [{"node": "critique", "detail": detail}],
    }


def should_revise(state: AgentState) -> Literal["write", "__end__"]:
    """The conditional edge — the reason this is a graph and not a chain."""
    if state["issues"] and state["revisions"] < MAX_REVISIONS:
        return "write"
    return END


# ----------------------------------------------------------------- graph ----


def build_graph():
    """Wire the nodes into the cycle and compile."""
    graph = StateGraph(AgentState)
    graph.add_node("select", select_node)
    graph.add_node("write", write_node)
    graph.add_node("critique", critique_node)

    graph.add_edge(START, "select")
    graph.add_edge("select", "write")
    graph.add_edge("write", "critique")
    graph.add_conditional_edges("critique", should_revise, {"write": "write", END: END})

    return graph.compile()


AGENT = build_graph()


def mermaid() -> str:
    """The graph's own diagram, so the page can never drift from the code."""
    return AGENT.get_graph().draw_mermaid()


def final_payload(state: dict, records: list[dict]) -> dict:
    """Shape the finished state into what the frontend shows and downloads."""
    bullets_by_id = {d["experienceId"]: d["bullets"] for d in state.get("drafts", [])}
    selected = [
        {**s, "bullets": bullets_by_id.get(s["experienceId"], [])}
        for s in state.get("selected", [])
    ]
    chosen_ids = {s["experienceId"] for s in selected}

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "model": MODEL,
        "consideredCount": len(records),
        "selected": selected,
        "notSelected": [
            {"experienceId": str(r["id"]), "role": r["role"], "company": r["company"]}
            for r in records
            if str(r["id"]) not in chosen_ids
        ],
        "revisions": state.get("revisions", 0),
        "remainingIssues": state.get("issues", []),
        "trace": state.get("trace", []),
    }
