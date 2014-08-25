var your_team_index = 0;
var players = {};
var teams = {};
var curr_round = 0;
var curr_team = 0;
var step = 1;
var rounds_lookahead = 1;

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
        if (team_players[i]["pos"] == "QB") {
            if (ordered_team["QB"] == null) {
                ordered_team["QB"] = team_players[i];
            }
            else {
                ordered_team["BN"].push(team_players[i]);
            }
        }
        else if (team_players[i]["pos"] == "WR") {
            if (ordered_team["WR"].length < 3) {
                ordered_team["WR"].push(team_players[i]);
            }
            else {
                ordered_team["BN"].push(team_players[i]);
            }
        }
        else if (team_players[i]["pos"] == "RB") {
            if (ordered_team["RB"].length < 2) {
                ordered_team["RB"].push(team_players[i]);
            }
            else {
                ordered_team["BN"].push(team_players[i]);
            }
        }
        else if (team_players[i]["pos"] == "TE") {
            if (ordered_team["TE"] == null) {
                ordered_team["TE"] = team_players[i];
            }
            else {
                ordered_team["BN"].push(team_players[i]);
            }
        }
        else if (team_players[i]["pos"] == "DST") {
            if (ordered_team["DST"] == null) {
                ordered_team["DST"] = team_players[i];
            }
            else {
                ordered_team["BN"].push(team_players[i]);
            }
        }
        else if (team_players[i]["pos"] == "K") {
            if (ordered_team["K"] == null) {
                ordered_team["K"] = team_players[i];
            }
            else {
                ordered_team["BN"].push(team_players[i]);
            }
        }
    }
    return ordered_team;
}

function initialize() {
    console.log($("#show_drafted_players").prop("checked"));
    var player_list_html = "<tr><th></th><th>Avg Rank</th><th>ADP</th></tr>";
    for (var i = 0; i < players.length; i++) {
        var show_player = false;
        if (!("is_drafted" in players[i]) || $("#show_drafted_players").prop("checked")) {
            show_player = true;
        }
        var pos_check = false;
        if ($("#filter_player_list").val() == "all" || players[i]["pos"] == $("#filter_player_list").val()) {
            pos_check = true;
        }
        if (show_player && pos_check) {
            if ("is_drafted" in players[i]) {
                player_list_html += "<tr><td>" + (i + 1) + ". <span class=\"drafted_player\">" + players[i]["name_pos"] + 
                    "</span></td><td>" +  players[i]["avg_rank"] + "</td><td>" +  players[i]["adp"] + "</td></tr>";
            }
            else {
                player_list_html += "<tr><td>" + (i + 1) + ". <span class=\"undrafted_player\" onclick=\"select_player(" + i + ", false)\">" + players[i]["name_pos"] + 
                    "</span></td><td>" +  players[i]["avg_rank"] + "</td><td>" +  players[i]["adp"] + "</td></tr>";
            }
        }
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
                draft_table_html += "<td>Current Pick</td>";
            }
            else {
                var player_name = i < teams[j]["players"].length ? teams[j]["players"][i]["name_pos"] : "";
                var class_html = i < teams[j]["players"].length ? " class=\"" + teams[j]["players"][i]["pos"] + "\"" : "";
                draft_table_html += "<td" + class_html + ">" + player_name + "</td>";
            }
        }
        draft_table_html += "</tr>";
    }
    $("#draft_table").html(draft_table_html);
    var ordered_team = order_team(teams[your_team_index]["players"]);
    var your_team_html = "<tr><th>Your Team</th></tr>";
    your_team_html += "<tr><td>QB</td><td>" + (ordered_team["QB"] ? ordered_team["QB"]["name_pos"] : "") + "</td></tr>";
    for (var i = 0; i < 3; i++) {
        your_team_html += "<tr><td>WR</td><td>" + (i < ordered_team["WR"].length ? ordered_team["WR"][i]["name_pos"] : "") + "</td></tr>";
    }
    for (var i = 0; i < 2; i++) {
        your_team_html += "<tr><td>RB</td><td>" + (i < ordered_team["RB"].length ? ordered_team["RB"][i]["name_pos"] : "") + "</td></tr>";
    }
    your_team_html += "<tr><td>TE</td><td>" + (ordered_team["TE"] ? ordered_team["TE"]["name_pos"] : "") + "</td></tr>";
    your_team_html += "<tr><td>DST</td><td>" + (ordered_team["DST"] ? ordered_team["DST"]["name_pos"] : "") + "</td></tr>";
    your_team_html += "<tr><td>K</td><td>" + (ordered_team["K"] ? ordered_team["K"]["name_pos"] : "") + "</td></tr>";
    for (var i = 0; i < 6; i++) {
        your_team_html += "<tr><td>BN</td><td>" + (i < ordered_team["BN"].length ? ordered_team["BN"][i]["name_pos"] : "") + "</td></tr>";
    }
    $("#your_team").html(your_team_html);
    if (curr_round < 15) {
        load_suggestions();
    }
}

function evaluate_state(team) {
    var num_qb_bn = 0;
    var num_wr_bn = 0;
    var num_rb_bn = 0;
    var num_te_bn = 0;
    var num_dst_bn = 0;
    var final_score = 0;
    var score = 0;
    var ordered_team = order_team(teams[team]["players"]);
    for (var pos in ordered_team) {
        if (pos == "QB" || pos == "TE" || pos == "DST" || pos == "K") {
            if (ordered_team[pos] != null) {
                var score = 0;
                if (ordered_team[pos]["adp"] != null) {
                    score = (ordered_team[pos]["avg_rank"] + ordered_team[pos]["adp"]) / 2;
                }
                else {
                    score = ordered_team[pos]["avg_rank"];
                }
                if (pos == "K") {
                    if (teams[team]["players"].length == 14) {
                        score *= 3.0;
                    }
                    else if (teams[team]["players"].length == 15) {
                        score *= 0.8;
                    }
                    else {
                        score *= 5.0;
                    }
                }
                final_score += score;
            }
        }
        else if (pos == "WR" || pos == "RB" || pos == "BN") {
            for (var i = 0; i < ordered_team[pos].length; i++) {
                var score = 0;
                if (ordered_team[pos][i]["adp"] != null) {
                    score = (ordered_team[pos][i]["avg_rank"] + ordered_team[pos][i]["adp"]) / 2;
                }
                else {
                    score = ordered_team[pos][i]["avg_rank"];
                }
                if (pos == "BN") {
                    score *= 4.0;
                    if (ordered_team[pos][i]["pos"] == "QB") {
                        num_qb_bn += 1;
                    }
                    else if (ordered_team[pos][i]["pos"] == "WR") {
                        num_wr_bn += 1;
                    }
                    else if (ordered_team[pos][i]["pos"] == "RB") {
                        num_rb_bn += 1;
                    }
                    else if (ordered_team[pos][i]["pos"] == "TE") {
                        num_te_bn += 1;
                    }
                    else if (ordered_team[pos][i]["pos"] == "DST") {
                        num_dst_bn += 1;
                    }
                }
                final_score += score;
            }
        }
    }
    final_score /= teams[team]["players"].length;
    if (num_qb_bn > 2) {
        final_score *= 1.2;
    }
    else if (num_qb_bn > 1) {
        final_score *= 1.1;
    }
    if (Math.abs(num_wr_bn - num_rb_bn) > 1) {
        final_score *= 1.2;
    }
    else if (num_rb_bn - num_wr_bn > 0) {
        final_score *= 1.1;
    }
    if (num_te_bn > 2) {
        final_score *= 1.2;
    }
    else if (num_te_bn > 1) {
        final_score *= 1.1;
    }
    if (num_dst_bn > 2) {
        final_score *= 1.2;
    }
    else if (num_dst_bn > 1) {
        final_score *= 1.1;
    }
    return final_score;
}

function get_possible_picks() {
    var top_qb_id = null;
    var top_wr_id = null;
    var top_rb_id = null;
    var top_te_id = null;
    var top_dst_id = null;
    var top_k_id = null;
    for (var i = 0; i < players.length; i++) {
        if ("is_drafted" in players[i]) {
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
    return [top_qb_id, top_wr_id, top_rb_id, top_te_id, top_dst_id, top_k_id];
}

function pick_other_teams(saved_curr_team) {
    var num_teams_picked = 0;
    while (curr_team != saved_curr_team) {
        var possible_picks = get_possible_picks();
        //console.log(possible_picks);
        var best_score = 1000000;
        var best_player = 0;
        for (var i = 0; i < possible_picks.length; i++) {
            //console.log(possible_picks);
            if (possible_picks[i] != null) {
                //console.log("pick " + possible_picks[i] + " for " + curr_team + " in " + curr_round);
                var other_team = curr_team;
                select_player(possible_picks[i], true);
                var score = evaluate_state(other_team);
                undo_pick(true);
                //console.log("Score: " + score);
                if (score < best_score) {
                    best_score = score;
                    best_player = possible_picks[i];
                }
            }
        }
        // console.log("best player " + best_player)
        // console.log("best score " + best_score)
        select_player(best_player, true);
        num_teams_picked += 1;
    }
    return num_teams_picked;
}

function recurse_states(depth, saved_curr_team) {
    if (depth == 0) {
        var score = evaluate_state(saved_curr_team);
        //$("#test").html(JSON.stringify(teams[saved_curr_team]["players"]));
        //console.log("undo last pick " + curr_team + " in " + curr_round);
        return [{"score": score, "log": []}];
    }
    else {
        var num_teams_picked = 0;
        if (curr_team != saved_curr_team) {
            num_teams_picked = pick_other_teams(saved_curr_team);
        }
        if (curr_round >= 14) {
            depth = 1;
        }
        // console.log("Depth: " + depth);
        // console.log("curr_round: " + curr_round);
        // console.log("saved_curr_team: " + saved_curr_team);
        // console.log("curr_team: " + curr_team);
        var possible_picks = get_possible_picks();
        var best_score = 1000000;
        var best_picks = [];
        for (var i = 0; i < possible_picks.length; i++) {
            //console.log(possible_picks);
            if (possible_picks[i] != null) {
                //console.log("pick " + possible_picks[i] + " for " + curr_team + " in " + curr_round);
                select_player(possible_picks[i], true);
                var picks = recurse_states(depth - 1, saved_curr_team);
                for (var j = 0; j < picks.length; j++) {
                    picks[j]["log"].splice(0, 0, possible_picks[i]);
                }
                undo_pick(true);
                //console.log("Score: " + score);
                best_picks = best_picks.concat(picks);
            }
        }
        best_picks = best_picks.sort(function(a,b){return a["score"] - b["score"]});
        if (best_picks.length > 5) {
            best_picks = best_picks.slice(0, 5);
        }
        //console.log("best player " + best_player)
        //console.log("best score " + best_score)
        for (var i = 0; i < num_teams_picked; i++) {
            //console.log("un-autodrafting: " + curr_team + " in " + curr_round);
            undo_pick(true);
        }
        return best_picks;
    }
}

function load_suggestions() {
    var best_picks = recurse_states(rounds_lookahead, curr_team);
    var suggestions_html = "<tr><th>Estimated Team Rank</th><th>Suggested Pick</th>";
    for (var i = 0; i < best_picks[0]["log"].length - 1; i++) {
        suggestions_html += "<th>Estimated Pick " + (i + 1) + "</th>";
    }
    suggestions_html += "</tr>";
    for (var i = 0; i < best_picks.length; i++) {
        suggestions_html += "<tr>";
        suggestions_html += "<td>" + best_picks[i]["score"].toFixed(2) + "</td>";
        suggestions_html += "<td><span class=\"undrafted_player\" onclick=\"select_player(" + best_picks[i]["log"][0] + ", false)\">" + 
            players[best_picks[i]["log"][0]]["name_pos"] + "</span></td>";
        for (var j = 0; j < best_picks[i]["log"].length - 1; j++) {
            suggestions_html += "<td>" + players[best_picks[i]["log"][j + 1]]["name_pos"] + "</td>";
        }
        suggestions_html += "</tr>";
    }
    $("#suggestions").html(suggestions_html);
}

function select_player(player_id, simulation) {
    if (curr_round < 15) {
        players[player_id]["is_drafted"] = true;
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
        delete players[player_id]["is_drafted"];
        if (simulation == false) {
            initialize();
        }
    }
}

$(document).ready(function() {
    $(".show_on_load").hide()
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
                your_team_index = parseInt($("#draft_pos").val()) - 1;
                players = data["players"]
                teams = data["teams"]
                curr_round = 0;
                curr_team = 0;
                step = 1;
                initialize();
                $(".show_on_load").show()
            }
        });
    });
    $("#filter_player_list").change(function() {
        initialize();
    });
    $("#rounds_lookahead").change(function() {
        rounds_lookahead = parseInt($("#rounds_lookahead").val());
    });
    $("#show_drafted_players").click(function() {
        initialize();
    });
    $("#undo_pick").click(function() {
        undo_pick(false);
    });
});
