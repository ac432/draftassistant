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
                if self.current_player["adp"]:
                    self.current_player["score"] = (self.current_player["avg_rank"] + self.current_player["adp"]) / 2
                else:
                    self.current_player["score"] = self.current_player["avg_rank"]
                self.players.append(self.current_player)
            self.current_player = {"name": node.get("fp-player-name"), "notes": ""}
            print "%s. %s" % (len(self.players) + 1, self.current_player["name"])
            # Get notes
            player_url_node = node.getprevious().getprevious()
            if player_url_node is not None:
                player_url = "https://www.fantasypros.com%s" % player_url_node.get("href")
                html = requests.get(player_url).text
                player_node = lxml.html.document_fromstring(html)
                self.get_player_notes(player_node)
        if self.player_column is not None and node.tag == "td":
            if self.player_column == 0:
                self.current_player["pos"] = "".join([char for char in node.text if not char.isdigit()])
                self.current_player["name_pos"] = "%s (%s)" % (self.current_player["name"], self.current_player["pos"])
            elif self.player_column == 1:
                self.current_player["team_bye"] = ("BYE %s" % node.text) if node.text else None
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
        if node.tag == "div" and node.get("class") == "content" and not self.current_player["notes"]:
            self.in_notes = True
        if self.in_notes and node.tag == "p" and node.text:
            self.current_player["notes"] = node.text
            self.in_notes = False
            return
        for child_node in node:
            self.get_player_notes(child_node)

    def reorder_players(self):
        self.players = sorted(self.players, key=lambda x: x["score"])
        for i, player in enumerate(self.players):
            player["id"] = i

for scoring_format in ["consensus", "ppr", "half-point-ppr"]:
    print scoring_format
    html = requests.get("https://www.fantasypros.com/nfl/rankings/%s-cheatsheets.php" % scoring_format).text
    node = lxml.html.document_fromstring(html)
    parser = FantasyProsParser()
    parser.process_players(node)
    parser.reorder_players()
    with open("..%sdata%s%s-players.json" % (os.sep, os.sep, scoring_format), "w") as f:
        json.dump(parser.players, f)
    print ""
