var your_team_index = 0;
var players = {};
var teams = {};
var curr_round = 0;
var curr_team = 0;
var step = 1;
var suggested_player = 0;

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
    var ordered_team = {"QB": null, "WR": [], "RB": [], "TE": null, "DST": null, "K": null, "BN": []}
    for (var i = 0; i < team_players.length; i++) {
        var player_name = team_players[i]["name"] + " (" + team_players[i]["pos"] + ")";
        if (team_players[i]["pos"] == "QB") {
            if (ordered_team["QB"] == null) {
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
            if (ordered_team["TE"] == null) {
                ordered_team["TE"] = player_name;
            }
            else {
                ordered_team["BN"].push(player_name);
            }
        }
        else if (team_players[i]["pos"] == "DST") {
            if (ordered_team["DST"] == null) {
                ordered_team["DST"] = player_name;
            }
            else {
                ordered_team["BN"].push(player_name);
            }
        }
        else if (team_players[i]["pos"] == "K") {
            if (ordered_team["K"] == null) {
                ordered_team["K"] = player_name;
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
    for (var i = 0; i < players.length; i++) {
        if ("drafted" in players[i] || ($("#filter_player_list").val() != "all" && players[i]["pos"] != $("#filter_player_list").val())) {
            continue;
        }
        player_list_html += "<tr><td>" + (i + 1) + ". <span onclick=\"select_player(" + i + ", false)\">" + players[i]["name"] + 
            " (" + players[i]["pos"] + ")</span></td><td>" +  players[i]["avg_rank"] + "</td><td>" +  players[i]["adp"] + "</td></tr>";
    }
    $("#player_list").html(player_list_html);
    var draft_table_html = "<tr><th></th>";
    for (var i = 0; i < teams.length; i++) {
        if (teams[i]["name"] == "Your Team") {
            draft_table_html += "<th style=\"background-color: LightGray;\">Your Team</th>";
        }
        else {
            draft_table_html += "<th>" + teams[i]["name"] + "</th>";
        }
    }
    draft_table_html += "</tr>";
    for (var i = 0; i < 15; i++) {
        draft_table_html += "<tr><td>Round " + (i + 1) + "</td>";
        for (var j = 0; j < teams.length; j++) {
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
    your_team_html += "<tr><td>QB</td><td>" + (ordered_team["QB"] ? ordered_team["QB"] : "") + "</td></tr>";
    for (var i = 0; i < 3; i++) {
        your_team_html += "<tr><td>WR</td><td>" + (i < ordered_team["WR"].length ? ordered_team["WR"][i] : "") + "</td></tr>";
    }
    for (var i = 0; i < 2; i++) {
        your_team_html += "<tr><td>RB</td><td>" + (i < ordered_team["RB"].length ? ordered_team["RB"][i] : "") + "</td></tr>";
    }
    your_team_html += "<tr><td>TE</td><td>" + (ordered_team["TE"] ? ordered_team["TE"] : "") + "</td></tr>";
    your_team_html += "<tr><td>DST</td><td>" + (ordered_team["DST"] ? ordered_team["DST"] : "") + "</td></tr>";
    your_team_html += "<tr><td>K</td><td>" + (ordered_team["K"] ? ordered_team["K"] : "") + "</td></tr>";
    for (var i = 0; i < 6; i++) {
        your_team_html += "<tr><td>BN</td><td>" + (i < ordered_team["BN"].length ? ordered_team["BN"][i] : "") + "</td></tr>";
    }
    $("#your_team").html(your_team_html);
    load_suggestions();
}

function evaluate_state(team) {
    score = 0;
    for (var i = 0; i < teams[team]["players"].length; i++) {
        score += teams[team]["players"][i]["avg_rank"];
    }
    score /= teams[team]["players"].length;
    return score;
}

function auto_draft(saved_curr_team) {
    var num_auto_draft = 0;
    while (curr_team != saved_curr_team) {
        var player_id = null;
        var ordered_team = order_team(teams[curr_team]["players"]);
        for (var i = 0; i < players.length; i++) {
            if ("drafted" in players[i]) {
                continue;
            }
            if (teams[curr_team]["players"].length > 9 || 
                    (players[i]["pos"] == "QB" && ordered_team["QB"] == null) || 
                    (players[i]["pos"] == "WR" && ordered_team["WR"].length < 3) || 
                    (players[i]["pos"] == "RB" && ordered_team["RB"] .length < 2) || 
                    (players[i]["pos"] == "TE" && ordered_team["TE"] == null) || 
                    (players[i]["pos"] == "DST" && ordered_team["DST"] == null) || 
                    (players[i]["pos"] == "K" && ordered_team["K"] == null)) {
                player_id = i;
                break
            }
        }
        //console.log("autodraft " + player_id + " for " + curr_team + " in " + curr_round);
        select_player(player_id, true);
        num_auto_draft += 1;
    }
    return num_auto_draft;
}

function recurse_states(depth, saved_curr_team) {
    if (depth == 0 || curr_round >= 15) {
        var score = evaluate_state(saved_curr_team);
        //$("#test").html(JSON.stringify(teams[saved_curr_team]["players"]));
        //console.log("undo last pick " + curr_team + " in " + curr_round);
        undo_pick(true);
        return score;
    }
    else {
        var num_auto_draft = 0;
        if (curr_team != saved_curr_team) {
            num_auto_draft = auto_draft(saved_curr_team);
        }
        //console.log("Depth: " + depth);
        //console.log("saved_curr_team: " + saved_curr_team);
        //console.log("curr_team: " + curr_team);
        var top_qb_id = null;
        var top_wr_id = null;
        var top_rb_id = null;
        var top_te_id = null;
        var top_dst_id = null;
        var top_k_id = null;
        for (var i = 0; i < players.length; i++) {
            if ("drafted" in players[i]) {
                continue;
            }
            if (players[i]["pos"] == "QB" && top_qb_id == null) {
                top_qb_id = i;
            }
            else if (players[i]["pos"] == "WR" && top_wr_id == null) {
                top_wr_id = i;
            }
            else if (players[i]["pos"] == "RB" && top_rb_id == null) {
                top_rb_id = i;
            }
            else if (players[i]["pos"] == "TE" && top_te_id == null) {
                top_te_id = i;
            }
            else if (players[i]["pos"] == "DST" && top_dst_id == null) {
                top_dst_id = i;
            }
            else if (players[i]["pos"] == "K" && top_k_id == null) {
                top_k_id = i;
            }
            if (top_qb_id != null && top_wr_id != null && top_rb_id != null && top_te_id != null && top_dst_id != null && top_k_id != null) {
                break;
            }
        }
        var possible_picks = [top_qb_id, top_wr_id, top_rb_id, top_te_id, top_dst_id, top_k_id];
        var best_score = 1000000;
        var best_player = 0;
        for (var i = 0; i < possible_picks.length; i++) {
            //console.log(possible_picks);
            if (possible_picks[i] != null) {
                //console.log("pick " + possible_picks[i] + " for " + curr_team + " in " + curr_round);
                select_player(possible_picks[i], true);
                var score = recurse_states(depth - 1, saved_curr_team);
                if (depth > 1) {
                    //console.log("undo last pick: " + curr_team + " in " + curr_round);
                    undo_pick(true);
                }
                //console.log("Score: " + score);
                if (score < best_score) {
                    best_score = score;
                    best_player = possible_picks[i];
                }
            }
        }
        suggested_player = best_player;
        //console.log("best player " + best_player)
        //console.log("best score " + best_score)
        //console.log("suggested player " + suggested_player)
        for (var i = 0; i < num_auto_draft; i++) {
            //console.log("un-autodrafting: " + curr_team + " in " + curr_round);
            undo_pick(true);
        }
        return best_score;
    }
}

function load_suggestions() {
    recurse_states(2, curr_team);
    console.log("suggested player " + suggested_player);
}

function select_player(player_id, simulation) {
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
        if (simulation == false) {
            initialize();
        }
    }
}

function undo_pick(simulation) {
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
        if (simulation == false) {
            initialize();
        }
    }
}

$(document).ready(function() {
    $("#data").hide()
    numbers_dropdown("num_teams", 4, 14, 10);
    numbers_dropdown("draft_pos", 1, 10, 1);
    $("#num_teams").change(function() {
        numbers_dropdown("draft_pos", 1, parseInt($("#num_teams").val()), parseInt($("#draft_pos").val()));
    });
    $("#initialize").submit(function(event) {
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
        undo_pick(false);
    });
});