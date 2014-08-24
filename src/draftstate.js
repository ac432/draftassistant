var your_team_index = 0;
var players = {};
var teams = {};
var curr_round = 0;
var curr_team = 0;
var step = 1;

function numbers_dropdown(id, start, end, selected) {
    var dropdown_html = "";
    for (var i = start; i <= end; i++) {
        if (i == selected) {
            dropdown_html += "<option selected=\"selected\" value=\"" + i + "\">" + i + "</option>";
        }
        else {
            dropdown_html += "<option value=\"" + i + "\">" + i + "</option>";
        }
    }
    $("#" + id).html(dropdown_html);
}

function order_team(team_players) {
    var ordered_team = {"QB": "", "WR": [], "RB": [], "TE": "", "DST": "", "BN": []}
    for (i = 0; i < team_players.length; i++) {
        var player_name = team_players[i]["name"] + " (" + team_players[i]["pos"] + ")";
        if (team_players[i]["pos"] == "QB") {
            if (ordered_team["QB"] == "") {
                ordered_team["QB"] = player_name;
            }
            else {
                ordered_team["BN"].push(player_name);
            }
        }
        else if (team_players[i]["pos"] == "WR") {
            if (ordered_team["WR"].length < 3) {
                ordered_team["WR"].push(player_name);
            }
            else {
                ordered_team["BN"].push(player_name);
            }
        }
        else if (team_players[i]["pos"] == "RB") {
            if (ordered_team["RB"].length < 2) {
                ordered_team["RB"].push(player_name);
            }
            else {
                ordered_team["BN"].push(player_name);
            }
        }
        else if (team_players[i]["pos"] == "TE") {
            if (ordered_team["TE"] == "") {
                ordered_team["TE"] = player_name;
            }
            else {
                ordered_team["BN"].push(player_name);
            }
        }
        else if (team_players[i]["pos"] == "DST") {
            if (ordered_team["DST"] == "") {
                ordered_team["DST"] = player_name;
            }
            else {
                ordered_team["BN"].push(player_name);
            }
        }
    }
    return ordered_team;
}

function initialize() {
    var player_list_html = "<tr><th></th><th>Avg Rank</th><th>ADP</th></tr>";
    for (i = 0; i < players.length; i++) {
        if ("drafted" in players[i] || ($("#filter_player_list").val() != "all" && players[i]["pos"] != $("#filter_player_list").val())) {
            continue;
        }
        player_list_html += "<tr><td>" + (i + 1) + ". <span onclick=\"select_player(" + i + ")\">" + players[i]["name"] + 
            " (" + players[i]["pos"] + ")</span></td><td>" +  players[i]["avg_rank"] + "</td><td>" +  players[i]["adp"] + "</td></tr>";
    }
    $("#player_list").html(player_list_html);
    var draft_table_html = "<tr><th></th>";
    for (i = 0; i < teams.length; i++) {
        if (teams[i]["name"] == "Your Team") {
            draft_table_html += "<th style=\"background-color: LightGray;\">Your Team</th>";
        }
        else {
            draft_table_html += "<th>" + teams[i]["name"] + "</th>";
        }
    }
    draft_table_html += "</tr>";
    for (i = 0; i < 15; i++) {
        draft_table_html += "<tr><td>Round " + (i + 1) + "</td>";
        for (j = 0; j < teams.length; j++) {
            if (i == curr_round && j == curr_team) {
                draft_table_html += "<td style=\"background-color: yellow;\">Current Pick</td>";
            }
            else {
                var player_name = i < teams[j]["players"].length ? (teams[j]["players"][i]["name"] + 
                    " (" + teams[j]["players"][i]["pos"] + ")") : "";
                draft_table_html += "<td>" + player_name + "</td>";
            }
        }
        draft_table_html += "</tr>";
    }
    $("#draft_table").html(draft_table_html);
    var ordered_team = order_team(teams[your_team_index]["players"]);
    var your_team_html = "<tr><th>Your Team</th></tr>";
    your_team_html += "<tr><td>QB</td><td>" + ordered_team["QB"] + "</td></tr>";
    for (i = 0; i < 3; i++) {
        your_team_html += "<tr><td>WR</td><td>" + (i < ordered_team["WR"].length ? ordered_team["WR"][i] : "") + "</td></tr>";
    }
    for (i = 0; i < 2; i++) {
        your_team_html += "<tr><td>RB</td><td>" + (i < ordered_team["RB"].length ? ordered_team["RB"][i] : "") + "</td></tr>";
    }
    your_team_html += "<tr><td>TE</td><td>" + ordered_team["TE"] + "</td></tr>";
    your_team_html += "<tr><td>DST</td><td>" + ordered_team["DST"] + "</td></tr>";
    for (i = 0; i < 6; i++) {
        your_team_html += "<tr><td>BN</td><td>" + (i < ordered_team["BN"].length ? ordered_team["BN"][i] : "") + "</td></tr>";
    }
    $("#your_team").html(your_team_html);
}

function select_player(player_id) {
    if (curr_round < 15) {
        players[player_id]["drafted"] = true;
        teams[curr_team]["players"].push(players[player_id]);
        if (curr_team + step >= teams.length) {
           curr_round += 1;
           step = -1;
        }
        else if (curr_team + step < 0) {
           curr_round += 1;
           step = 1;
        }
        else {
            curr_team += step;
        }
        initialize();
    }
}

function undo_pick() {
    if (curr_round > 0 || curr_team > 0) {
        if (curr_team - step >= teams.length) {
           curr_round -= 1;
           step = 1;
        }
        else if (curr_team - step < 0) {
           curr_round -= 1;
           step = -1;
        }
        else {
            curr_team -= step;
        }
        player_id = teams[curr_team]["players"].pop()["id"];
        delete players[player_id]["drafted"];
        initialize();
    }
}

$(document).ready(function() {
    $("#data").hide()
    numbers_dropdown("num_teams", 4, 14, 10);
    numbers_dropdown("draft_pos", 1, 10, 1);
    $("#num_teams").change(function() {
        numbers_dropdown("draft_pos", 1, parseInt($("#num_teams").val()), parseInt($("#draft_pos").val()));
    });
    $("#initialize").submit(function() {
        event.preventDefault();
        $.ajax({
            url: "cgi-bin/helper.py",
            type: "POST",
            data: $("#initialize").serialize(),
            success: function(data) {
                your_team_index = $("#draft_pos").val() - 1;
                players = data["players"]
                teams = data["teams"]
                curr_round = 0;
                curr_team = 0;
                step = 1;
                initialize();
                $("#data").show()
            }
        });
    });
    $("#filter_player_list").change(function() {
        initialize();
    });
    $("#undo_pick").click(function() {
        undo_pick();
    });
});