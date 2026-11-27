import copy
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src/python"))
from domain import GameState, Mission, SolutionValidator
from game import Game

MISSIONS = json.loads((ROOT / "content/missions.json").read_text())


class DomainTests(unittest.IsolatedAsyncioTestCase):
    def test_save_contract(self):
        state = GameState(started=True, completed=10, current=4, pilot="wilson", intro_seen=True)
        self.assertEqual(GameState.restore(state.pack(), 10), state)
        for changes in [{"completed": 11}, {"current": False}, {"pilot":"chen"}, {"started":False}, {"intro_seen":False}]:
            changed = state.pack()
            changed["state"].update(changes)
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                GameState.restore(changed,10)

    async def test_locked_missions_and_invalid_import(self):
        game = Game(MISSIONS,None)
        await game.command("new")
        with self.assertRaises(ValueError):
            await game.command("select",2)
        before = game.state.pack()
        with self.assertRaises(ValueError):
            await game.command("import",{"format":"other"})
        self.assertEqual(before,game.state.pack())

    def test_validator_multiplicity_null_types_and_order(self):
        mission = Mission(MISSIONS[1],None)
        columns = [["role",25]]
        data = {"columns":columns,"rows":[[None],["Pilot"],["Pilot"]]}
        report = {"sources":["role"],"distinct":False,"sets":[{"expected":data,"actual":copy.deepcopy(data)}]}
        actual = report["sets"][0]["actual"]
        actual["rows"].reverse()
        validator = SolutionValidator()
        self.assertEqual(validator.assess(mission,report)["status"],"pass")
        mission.data = dict(mission.data, ordered=True)
        self.assertEqual(validator.assess(mission,report)["status"],"review")
        mission.data["ordered"] = False
        actual["rows"] = [[None],[None],["Pilot"]]
        self.assertEqual(validator.assess(mission,report)["status"],"review")
        actual["rows"] = data["rows"]
        actual["columns"] = [["role",23]]
        self.assertEqual(validator.assess(mission,report)["status"],"review")

    def test_content_references(self):
        guide = json.loads((ROOT / "content/guide.json").read_text())
        self.assertEqual([m["id"] for m in MISSIONS],list(range(1,11)))
        for m in MISSIONS:
            self.assertTrue((ROOT / "public/art" / (m["scene"]+".png")).is_file())
            self.assertTrue((ROOT / "public/art" / (m["speaker"]+".png")).is_file())
            self.assertEqual(guide[m["guide"]-1]["id"],m["guide"])
            if m["solution"]:
                self.assertEqual(len(m["hints"]),3)
                self.assertEqual(m["hints"][2],m["solution"])

