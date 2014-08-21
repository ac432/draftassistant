#!/usr/bin/python
import os
import json
import urlparse

def something(param):
    with open("%s%s..%s..%sdata%splayers.json" % (os.path.dirname(os.path.realpath(__file__)), os.sep, os.sep, os.sep, os.sep)) as f:
        players = json.load(f)
    output = {"cwd": os.getcwd(), "filedir": os.path.dirname(os.path.realpath(__file__)), "param": param, "players": players}
    return output

args = urlparse.parse_qs(os.getenv("QUERY_STRING") or "")

output = something(args["param"][0])

print "Content-type: application/json"
print
print json.dumps(output)
