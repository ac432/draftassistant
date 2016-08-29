var your_team_index = 0;
var players = {};
var teams = {};
var curr_round = 0;
var curr_team = 0;
var step = 1;
var best_pick_id = 0;

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
    var ordered_team = {"QB": null, "WR": [], "RB": [], "TE": null, "WR/RB/TE": null, "DST": null, "K": null, "BN": []}
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
            if (ordered_team["WR"].length < 2) {
                ordered_team["WR"].push(team_players[i]);
            }
            else if (ordered_team["WR/RB/TE"] == null) {
                ordered_team["WR/RB/TE"] = team_players[i];
            }
            else {
                ordered_team["BN"].push(team_players[i]);
            }
        }
        else if (team_players[i]["pos"] == "RB") {
            if (ordered_team["RB"].length < 2) {
                ordered_team["RB"].push(team_players[i]);
            }
            else if (ordered_team["WR/RB/TE"] == null) {
                ordered_team["WR/RB/TE"] = team_players[i];
            }
            else {
                ordered_team["BN"].push(team_players[i]);
            }
        }
        else if (team_players[i]["pos"] == "TE") {
            if (ordered_team["TE"] == null) {
                ordered_team["TE"] = team_players[i];
            }
            else if (ordered_team["WR/RB/TE"] == null) {
                ordered_team["WR/RB/TE"] = team_players[i];
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

function get_full_name(player) {
    if (player["team_bye"] != null) {
        return player["name_pos"] + " " + player["team_bye"];
    }
    else {
        return player["name_pos"]
    }
}

function initialize() {
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
    var your_team1_html = "<tr><th>Your Team</th></tr>";
    your_team1_html += "<tr><td>QB</td><td>" + (ordered_team["QB"] ? get_full_name(ordered_team["QB"]) : "") + "</td></tr>";
    for (var i = 0; i < 2; i++) {
        your_team1_html += "<tr><td>WR</td><td>" + (i < ordered_team["WR"].length ? get_full_name(ordered_team["WR"][i]) : "") + "</td></tr>";
    }
    for (var i = 0; i < 2; i++) {
        your_team1_html += "<tr><td>RB</td><td>" + (i < ordered_team["RB"].length ? get_full_name(ordered_team["RB"][i]) : "") + "</td></tr>";
    }
    your_team1_html += "<tr><td>TE</td><td>" + (ordered_team["TE"] ? get_full_name(ordered_team["TE"]) : "") + "</td></tr>";
    your_team1_html += "<tr><td>WR/RB/TE</td><td>" + (ordered_team["WR/RB/TE"] ? get_full_name(ordered_team["WR/RB/TE"]) : "") + "</td></tr>";
    your_team1_html += "<tr><td>DST</td><td>" + (ordered_team["DST"] ? get_full_name(ordered_team["DST"]) : "") + "</td></tr>";
    $("#your_team1").html(your_team1_html);
    var your_team2_html = "<tr><th>&nbsp;</th></tr>";
    your_team2_html += "<tr><td>K</td><td>" + (ordered_team["K"] ? get_full_name(ordered_team["K"]) : "") + "</td></tr>";
    for (var i = 0; i < 6; i++) {
        your_team2_html += "<tr><td>BN</td><td>" + (i < ordered_team["BN"].length ? get_full_name(ordered_team["BN"][i]) : "") + "</td></tr>";
    }
    $("#your_team2").html(your_team2_html);
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
    var num_k_bn = 0
    var final_score = 0;
    var score = 0;
    var ordered_team = order_team(teams[team]["players"]);
    for (var pos in ordered_team) {
        if (pos == "QB" || pos == "TE" || pos == "WR/RB/TE" || pos == "DST" || pos == "K") {
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
                        score *= 5.0;
                    }
                    else if (teams[team]["players"].length == 15) {
                        score *= 1.0;
                    }
                    else {
                        score *= 8.0;
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
                    else if (ordered_team[pos][i]["pos"] == "K") {
                        num_k_bn += 1;
                    }
                }
                final_score += score;
            }
        }
    }
    final_score /= teams[team]["players"].length;
    if (num_qb_bn > 1) {
        final_score *= 2.0;
    }
    else if (num_qb_bn > 0) {
        final_score *= 1.1;
    }
    if (Math.abs(num_wr_bn - num_rb_bn) > 1) {
        final_score *= 1.2;
    }
    else if (num_rb_bn - num_wr_bn > 0) {
        final_score *= 1.1;
    }
    if (num_te_bn > 1) {
        final_score *= 2.0;
    }
    else if (num_te_bn > 0) {
        final_score *= 1.05;
    }
    if (num_dst_bn > 1) {
        final_score *= 2.0;
    }
    else if (num_dst_bn > 0) {
        final_score *= 1.2;
    }
    if (num_k_bn > 0) {
        final_score *= 2.0;
    }
    return final_score;
}

function get_possible_picks() {
    var possible_picks = [];
    var num_each_pos = 3;
    var num_qb = 0;
    var num_wr = 0;
    var num_rb = 0;
    var num_te = 0;
    var num_dst = 0;
    var num_k = 0;
    for (var i = 0; i < players.length; i++) {
        if ("is_drafted" in players[i]) {
            continue;
        }
        if (players[i]["pos"] == "QB") {
            if (num_qb >= num_each_pos) {
                continue;
            }
            else {
                num_qb += 1;
            }
        }
        else if (players[i]["pos"] == "WR") {
            if (num_wr >= num_each_pos) {
                continue;
            }
            else {
                num_wr += 1;
            }
        }
        else if (players[i]["pos"] == "RB") {
            if (num_rb >= num_each_pos) {
                continue;
            }
            else {
                num_rb += 1;
            }
        }
        else if (players[i]["pos"] == "TE") {
            if (num_te >= num_each_pos) {
                continue;
            }
            else {
                num_te += 1;
            }
        }
        else if (players[i]["pos"] == "DST") {
            if (num_dst >= num_each_pos) {
                continue;
            }
            else {
                num_dst += 1;
            }
        }
        else if (players[i]["pos"] == "K") {
            if (num_k >= num_each_pos) {
                continue;
            }
            else {
                num_k += 1;
            }
        }
        possible_picks.push(i);
    }
    return possible_picks;
}

function find_best_picks() {
    var possible_picks = get_possible_picks();
    //console.log("possible picks", JSON.stringify(possible_picks, null, 4))
    var best_picks = [];
    var saved_curr_team = curr_team
    for (var i = 0; i < possible_picks.length; i++) {
        select_player(possible_picks[i], true);
        score = evaluate_state(saved_curr_team);
        undo_pick(true);
        best_picks.push({"score": score, "player_id": possible_picks[i]});
    }
    best_picks.sort(function(a,b){return a["score"] - b["score"]});
    best_picks = best_picks.slice(0, 6);
    return best_picks;
}

function load_suggestions() {
    var best_picks = find_best_picks();
    var suggestions_html = "<tr><th>Estimated Team Rank</th><th>Suggested Pick</th></tr>";
    best_pick_id = best_picks[0]["player_id"];
    for (var i = 0; i < best_picks.length; i++) {
        suggestions_html += "<tr>";
        suggestions_html += "<td>" + best_picks[i]["score"].toFixed(2) + "</td>";
        suggestions_html += "<td><span class=\"undrafted_player\" onclick=\"select_player(" + best_picks[i]["player_id"] + ", false)\">" + 
            players[best_picks[i]["player_id"]]["name_pos"] + "</span></td>";
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

function auto_draft() {
    for (var i = 0; i < 15; i++) {
        for (var j = 0; j < teams.length; j++) {
            setTimeout(function(){select_player(best_pick_id, false)}, 500);
        }
    }
}

$(document).ready(function(){
    $(".show_on_load").hide()
    numbers_dropdown("num_teams", 4, 14, 10);
    numbers_dropdown("draft_pos", 1, 10, 1);
    $("#num_teams").change(function(){
        numbers_dropdown("draft_pos", 1, parseInt($("#num_teams").val()), parseInt($("#draft_pos").val()));
    });
    $("#initialize").submit(function(event){
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
    $("#filter_player_list").change(function(){
        initialize();
    });
    $("#show_drafted_players").click(function(){
        initialize();
    });
    $("#undo_pick").click(function(){
        undo_pick(false);
    });
    $("#auto_draft").click(function(){
        $("#auto_draft_confirm").html("Do you really want to auto draft the rest of the picks?");
        $("#auto_draft_confirm").dialog('open');
    });
    $("#auto_draft_confirm").dialog({
        resizable: false,
        modal: true,
        autoOpen: false,
        buttons: {
            'Confirm': function(){
                $(this).dialog('close');
                auto_draft();
            },
            Cancel: function(){
                $(this).dialog('close');
            }
        }
    });
});
