#!/usr/bin/python
import os
import cgi
import json

def initialize(num_teams, draft_pos):
    with open("%s%s..%s..%sdata%splayers.json" % (os.path.dirname(os.path.realpath(__file__)), os.sep, os.sep, os.sep, os.sep)) as f:
        players = json.load(f)
    teams = [{"name": "Your Team" if  draft_pos - 1 == i else "Team %s" % (i + 1), "players": []} for i in range(num_teams)]
    draft_state = {"teams": teams, "remaining_players": players, "curr_round": 0, "curr_team": 0}
    return draft_state

def select_player(draft_state, player_id):
	draft_state["teams"][draft_state["curr_team"]]["players"].append(draft_state["remaining_players"][player_id]["name"])
	return draft_state

form = cgi.FieldStorage()

if "num_teams" in form and "draft_pos" in form:
	draft_state = initialize(int(form.getvalue("num_teams")), int(form.getvalue("draft_pos")))
elif "draft_state" in form and "player_id" in form:
	draft_state = select_player(json.loads(form.getvalue("draft_state")), int(form.getvalue("player_id")))

print "Content-type: application/json"
print
print json.dumps(draft_state)
