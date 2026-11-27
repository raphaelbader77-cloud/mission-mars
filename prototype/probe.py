"""Feasibility probe shared by the browser and Node runtime test."""
import json

from ares_probe import execute, commit_visit


class FeasibilityProbe:
    """Exercise the exact boundaries needed by Mission Mars."""

    async def run(self):
        answer = await self.query(
            "SELECT name, years FROM probe_candidates WHERE years >= $1 ORDER BY name",
            [8],
        )
        expected = [{"name": "Alex", "years": 8}, {"name": "Maya", "years": 9}]
        if answer["rows"] != expected:
            raise ValueError("The database result changed in transit.")

        error = await self.query("SELEC broken", [])
        if error.get("code") != "42601":
            raise ValueError("PostgreSQL did not report the expected syntax error.")

        # A real PostgreSQL error must leave the next independent query usable.
        check = await self.query("SELECT 42 AS answer", [])
        if check["rows"] != [{"answer": 42}]:
            raise ValueError("Query after syntax error failed.")

        # The bridge commits mission progress and the world change together.
        before, after = json.loads(await commit_visit())
        if after["visits"] != before["visits"] + 1 or after["records"] != after["visits"]:
            raise ValueError("The world and its progress disagree.")
        return {
            "rows": answer["rows"],
            "sqlstate": error["code"],
            "postgres_message": error["message"],
            "previous": before,
            "saved": after,
            "restored": before["visits"] > 0 and before["records"] == before["visits"],
        }

    @staticmethod
    async def query(statement, parameters):
        return json.loads(await execute(statement, json.dumps(parameters)))


async def run_probe():
    return json.dumps(await FeasibilityProbe().run())
