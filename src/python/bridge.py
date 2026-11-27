"""Pyodide entry point shared by the game worker and WASM integration tests."""
import json
from game import Game
from domain import GameState
from flight_bridge import query

async def read_sql(text, reference):
    return json.loads(await query(text, reference))

game = Game(json.loads(missions_json), read_sql, json.loads(save_json))
async def operate(action, value_json):
    value = json.loads(value_json)
    answer = await game.command(action, value)
    return json.dumps({"answer":answer, "state":game.snapshot(), "save":game.state.pack()})
