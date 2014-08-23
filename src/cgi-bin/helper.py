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

form = cgi.FieldStorage()
draft_state = initialize(int(form.getvalue("num_teams")), int(form.getvalue("draft_pos")))

print "Content-type: application/json"
print
print json.dumps(draft_state)
