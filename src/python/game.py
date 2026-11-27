"""One Game owns a chapter, a player state and the story characters."""
from domain import Character, Chapter, GameState


class Game:
    def __init__(self, definitions, reader, saved=None):
        self.chapter = Chapter(definitions, reader)
        self.total = len(self.chapter.missions)
        self.state = GameState.restore(saved, self.total) if saved else GameState()
        people = [
            ("morgan","Dr. Elena Morgan","Mission Director"), ("nova","NOVA","Onboard Intelligence"),
            ("chen","Alex Chen","Engineer"), ("reyes","Dr. Maya Reyes","Scientist"),
            ("kim","Daniel Kim","Doctor"), ("brown","Oliver Brown","Pilot"), ("wilson","James Wilson","Pilot")]
        self.people = {p[0]: Character(*p) for p in people}

    def snapshot(self):
        state = self.state
        crew = ["chen","reyes","kim",state.pilot] if state.completed == self.total else []
        return dict(state.pack()["state"], crew=[vars(self.people[k]) for k in crew],
                    learned=list(range(1, state.completed + 1)), total=self.total,
                    characters={k: vars(person) for k, person in self.people.items()})

    async def command(self, action, value=None):
        s = self.state
        if action in ("new","reset"):
            self.state = GameState(started=action == "new", sound=s.sound, motion=s.motion)
        elif action == "intro":
            if not s.started:
                raise ValueError("Start a game first.")
            s.intro_seen = True
        elif action == "select":
            if type(value) != int or not s.started or not 1 <= value <= min(self.total, s.completed + 1):
                raise ValueError("Complete the preceding assignment to open this mission.")
            s.current = value
        elif action == "attempt":
            if not s.started or not s.intro_seen:
                raise ValueError("Complete the briefing first.")
            answer = await self.chapter.missions[s.current].attempt(value)
            if answer["status"] == "pass" and s.current == s.completed + 1:
                s.completed += 1
                if s.completed == self.total:
                    names = {row[0] for row in answer["preview"]["rows"]}
                    required = {"Alex Chen","Maya Reyes","Daniel Kim","James Wilson","Oliver Brown"}
                    if not required <= names:
                        raise ValueError("Roster data is missing a flight specialist.")
                    s.pilot = "brown"
            return answer
        elif action == "pilot":
            if s.completed != self.total or value not in ("brown","wilson"):
                raise ValueError("Choose a qualified pilot after the final assignment.")
            s.pilot = value
        elif action == "settings":
            if not isinstance(value, dict) or not set(value) <= {"sound","motion"} or any(type(v) != bool for v in value.values()):
                raise ValueError("Unknown setting.")
            for key, enabled in value.items():
                setattr(s, key, enabled)
        elif action == "import":
            self.state = GameState.restore(value, self.total)
        elif action == "export":
            return self.state.pack()
        elif action != "status":
            raise ValueError("Unknown flight command.")
        return None

