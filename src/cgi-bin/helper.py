#!/usr/bin/python
import os
import cgi
import json

def initialize(num_teams, draft_pos, scoring_format):
    with open("%s%s..%s..%sdata%s%s-players.json" % (os.path.dirname(os.path.realpath(__file__)), os.sep, os.sep, os.sep, os.sep, scoring_format)) as f:
        players = json.load(f)
    teams = [{"name": "Your Team" if  draft_pos - 1 == i else "Team %s" % (i + 1), "players": []} for i in range(num_teams)]
    output = {"teams": teams, "players": players}
    return output

form = cgi.FieldStorage()
output = initialize(int(form.getvalue("num_teams")), int(form.getvalue("draft_pos")), form.getvalue("scoring_format"))

print "Content-type: application/json"
print
print json.dumps(output)
