#!/usr/bin/python
import os
import cgi
import json

def initialize(num_teams, draft_pos):
    with open("%s%s..%s..%sdata%splayers.json" % (os.path.dirname(os.path.realpath(__file__)), os.sep, os.sep, os.sep, os.sep)) as f:
        players = json.load(f)
    teams = [{"name": "Your Team" if  draft_pos - 1 == i else "Team %s" % (i + 1), "players": []} for i in range(num_teams)]
    draft_state = {"teams": teams, "players": players, "curr_round": 0, "curr_team": 0, "step": 1}
    return draft_state

def select_player(draft_state, player_id):
    draft_state["players"][player_id]["drafted"] = True
    draft_state["teams"][draft_state["curr_team"]]["players"].append(draft_state["players"][player_id])
    if draft_state["curr_team"] + draft_state["step"] >= len(draft_state["teams"]):
        draft_state["curr_round"] += 1
        draft_state["step"] = -1
    elif draft_state["curr_team"] + draft_state["step"] < 0:
        draft_state["curr_round"] += 1
        draft_state["step"] = 1
    else:
        draft_state["curr_team"] += draft_state["step"]
    return draft_state

form = cgi.FieldStorage()

if "num_teams" in form and "draft_pos" in form:
    draft_state = initialize(int(form.getvalue("num_teams")), int(form.getvalue("draft_pos")))
elif "draft_state" in form and "player_id" in form:
    draft_state = select_player(json.loads(form.getvalue("draft_state")), int(form.getvalue("player_id")))

print "Content-type: application/json"
print
print json.dumps(draft_state)
