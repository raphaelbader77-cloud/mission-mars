"""Python domain objects. These classes also run in the team's desktop Python."""
from collections import Counter
from dataclasses import dataclass, fields
import json


@dataclass(frozen=True)
class Character:
    key: str
    name: str
    role: str


class Mission:
    def __init__(self, definition, reader):
        self.data = definition
        self.number = definition["id"]
        self.reader = reader

    def validate_focus(self, inspection):
        if self.data["requiresDistinct"] and not inspection["distinct"]:
            return "Use DISTINCT in this lesson so repeated roles collapse to one record."
        return ""

    async def attempt(self, input_sql):
        target = self.data["solution"]
        report = await self.reader(input_sql, target)
        return SolutionValidator().assess(self, report)


class Orientation(Mission):
    async def attempt(self, touches):
        # An actual row inspection and field selection precede the tour completion.
        if not isinstance(touches, dict) or touches.get("row") != 1 or touches.get("column") != "role":
            return {"status": "review", "message": "Select the first row, then click its role column header."}
        return {"status": "pass", "message": self.data["reward"]}


class Chapter:
    def __init__(self, definitions, reader):
        self.missions = {}
        for item in definitions:
            mission_type = Orientation if item["kind"] == "Orientation" else Mission
            self.missions[item["id"]] = mission_type(item, reader)


class SolutionValidator:
    @staticmethod
    def records(rows):
        # The encoding distinguishes true from 1, preserves NULL and duplicate rows.
        return [json.dumps(row, separators=(",", ":"), ensure_ascii=False) for row in rows]

    def assess(self, mission, report):
        if "error" in report:
            return {"status": report["kind"], "message": report["error"], "help": report.get("help", "")}
        explanation = mission.validate_focus(report)
        preview = report["sets"][0]["actual"]
        for dataset in report["sets"]:
            actual, expected = dataset["actual"], dataset["expected"]
            expected_cols = [name for name, _ in expected["columns"]]
            if report["sources"] != expected_cols:
                explanation = "Check the fields you selected and their order. The roster transmission needs " + ", ".join(expected_cols) + "."
                break
            if [x[1] for x in actual["columns"]] != [x[1] for x in expected["columns"]]:
                explanation = "The returned field types differ from the expected roster types."
                break
            a, b = self.records(actual["rows"]), self.records(expected["rows"])
            if len(a) != len(b) or (a != b if mission.data["ordered"] else Counter(a) != Counter(b)):
                if dataset is report["sets"][0]:
                    explanation = f"Your query ran and returned {len(a)} rows. The mission needs {len(b)}. Check each condition, including its boundary."
                    if len(a) == len(b):
                        explanation = "The row count matches, but some candidates differ. Check which people your filter includes."
                else:
                    explanation = "The roster matches today, but the rule fails on a second training roster. Check the requested conditions, not candidate IDs."
                break
        return {"status": "review" if explanation else "pass",
                "message": explanation or mission.data["reward"], "preview": preview}


@dataclass
class GameState:
    started: bool = False
    current: int = 1
    completed: int = 0
    pilot: str = ""
    sound: bool = True
    motion: bool = True
    intro_seen: bool = False

    def pack(self):
        return {"format": "mission-mars", "version": 1, "roster": "ares-13-v1",
                "state": {f.name: getattr(self, f.name) for f in fields(self)}}

    @classmethod
    def restore(cls, payload, total):
        if not isinstance(payload, dict) or payload.get("format") != "mission-mars" or type(payload.get("version")) is not int or payload["version"] != 1 or payload.get("roster") != "ares-13-v1":
            raise ValueError("This file is not a supported Mission Mars save.")
        raw = payload.get("state")
        defaults = cls()
        if not isinstance(raw, dict) or set(raw) != {f.name for f in fields(cls)}:
            raise ValueError("The save is incomplete.")
        for f in fields(cls):
            if type(raw[f.name]) is not type(getattr(defaults, f.name)):
                raise ValueError("The save contains an invalid field.")
        state = cls(**raw)
        if not (0 <= state.completed <= total and 1 <= state.current <= min(total, state.completed + 1)):
            raise ValueError("The save contains an invalid mission sequence.")
        if not state.started and (state.completed or state.intro_seen):
            raise ValueError("The save contains inconsistent progress.")
        if state.completed and not state.intro_seen:
            raise ValueError("The briefing flag is inconsistent.")
        if state.pilot not in (["brown", "wilson"] if state.completed == total else [""]):
            raise ValueError("The flight crew is inconsistent with the mission log.")
        return state

