import os
import json
import urllib2
import lxml.html
from pprint import pprint

class FantasyProsParser:
    def __init__(self):
        self.players = []
        self.current_player = {}
        self.player_column = None
        
    def process_html(self, node):
        if node.tag == "a" and node.get("fp-player-name") is not None:
            self.player_column = 0
            if self.current_player:
            	self.current_player["id"] = len(self.players)
                self.players.append(self.current_player)
            self.current_player = {"name": node.get("fp-player-name")}
        if self.player_column is not None and node.tag == "td":
            if self.player_column == 0:
                self.current_player["pos"] = "".join([char for char in node.text if not char.isdigit()])
                self.current_player["name_pos"] = "%s (%s)" % (self.current_player["name"], self.current_player["pos"])
            elif self.player_column == 3:
                self.current_player["avg_rank"] = float(node.text) if node.text else None
            elif self.player_column == 5:
                self.current_player["adp"] = float(node.text) if node.text else None
            self.player_column += 1
        for child_node in node:
            self.process_html(child_node)

html = urllib2.urlopen("http://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php").read()
node = lxml.html.document_fromstring(html)
parser = FantasyProsParser()
parser.process_html(node)
#pprint(parser.players)
with open("..%sdata%splayers.json" % (os.sep, os.sep), "w") as f:
    json.dump(parser.players, f)
