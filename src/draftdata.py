import os
import json
import requests
import lxml.html
from pprint import pprint

class FantasyProsParser:
    def __init__(self):
        self.players = []
        self.current_player = {}
        self.player_column = None
        self.in_notes = False
        
    def process_players(self, node):
        if node.tag == "a" and node.get("fp-player-name") is not None:
            self.player_column = 0
            if self.current_player:
            	self.current_player["id"] = len(self.players)
                self.players.append(self.current_player)
            self.current_player = {"name": node.get("fp-player-name"), "team_bye": node.getprevious().text if node.getprevious() is not None else None, "notes": ""}
            print "%s. %s" % (len(self.players) + 1, self.current_player["name"])
            # Get notes
            player_name_url = self.current_player["name"].replace("'", "").replace(".", "").replace(" ", "-").lower()
            html = requests.get("https://www.fantasypros.com/nfl/news/%s.php" % player_name_url).text
            player_node = lxml.html.document_fromstring(html)
            self.get_player_notes(player_node)
        if self.player_column is not None and node.tag == "td":
            if self.player_column == 0:
                self.current_player["pos"] = "".join([char for char in node.text if not char.isdigit()])
                self.current_player["name_pos"] = "%s (%s)" % (self.current_player["name"], self.current_player["pos"])
            elif self.player_column == 4:
                self.current_player["avg_rank"] = float(node.text) if node.text else None
            elif self.player_column == 6:
                self.current_player["adp"] = float(node.text) if node.text else None
            self.player_column += 1
        for child_node in node:
            self.process_players(child_node)

    def get_player_notes(self, node):
        if self.current_player["notes"]:
            return
        if node.tag == "div":
            if node.get("class") == "well notes":
                self.in_notes = True
            if self.in_notes and node.get("class") == "clearfix":
                self.current_player["notes"] = node.tail.strip()
                self.in_notes = False
                return
        for child_node in node:
            self.get_player_notes(child_node)

html = requests.get("https://www.fantasypros.com/nfl/rankings/half-point-ppr-cheatsheets.php").text
node = lxml.html.document_fromstring(html)
parser = FantasyProsParser()
parser.process_players(node)
with open("..%sdata%splayers.json" % (os.sep, os.sep), "w") as f:
    json.dump(parser.players, f)
