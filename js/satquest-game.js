// SAT QUEST: team session, countdown timer, scoring, result screen
(function () {
  var C = window.SQ || {}, LIMIT = (C.TIME_LIMIT_MIN || 20) * 60;
  var team = localStorage.getItem('sq_team'), start = Number(localStorage.getItem('sq_start'));
  if (!team || !start) { location.replace('index.html#start'); return; }
  var finished = false;
  function left() { return Math.max(0, LIMIT - Math.floor((Date.now() - start) / 1000)); }
  function fmt(t) { return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }

  var bar = document.getElementById('bar'), t = document.createElement('div');
  t.id = 'sqTimer'; t.innerHTML = '<span class="tm">' + fmt(left()) + '</span><small>' + team.replace(/</g, '&lt;') + '</small>';
  if (bar) bar.appendChild(t);
  var tick = setInterval(function () {
    var l = left(); t.querySelector('.tm').textContent = fmt(l);
    t.className = l <= 60 ? 'danger' : l <= 300 ? 'warn' : '';
    if (l <= 0 && !finished) { clearInterval(tick); window.satquestFinish(window.rs, true); }
  }, 500);

  window.satquestFinish = function (rs, timedOut) {
    if (finished) return; var tl = left(), ok = false, cost = 0, budget = 0, unmet = [];
    try {
      if (rs.updateRequirements) rs.updateRequirements(); else rs.checkRequirements();
      (rs.requirements || []).forEach(function (r) { if (!r.met) unmet.push(r.error || r.label || ''); });
      ok = (rs.requirements || []).length > 0 && unmet.length === 0;
      cost = rs.totals.cost.value; budget = rs.choices.mission.budget.value;
    } catch (e) { console.log(e); }
    var bp = 0, tp = 0;
    if (ok) {
      bp = budget > 0 ? Math.round((C.BUDGET_POINTS || 60) * Math.min(1, Math.max(0, (budget - cost) / budget))) : 0;
      tp = Math.round((C.TIME_POINTS || 40) * tl / LIMIT);
    }
    var res = {team: team, score: bp + tp, cost: cost, budget: budget, timeLeft: tl, elapsed: LIMIT - tl, success: ok, timedOut: !!timedOut};
    if (!ok && !timedOut) return show(res, bp, tp, unmet, false);
    finished = true; clearInterval(tick); localStorage.setItem('sq_done', '1');
    show(res, bp, tp, unmet, true); submit(res);
  };

  function submit(res) {
    var st = document.getElementById('sqSubmit');
    if (!C.SHEET_URL) { st.textContent = 'Leaderboard not connected. Show this screen to a volunteer.'; return; }
    st.textContent = 'Sending score...';
    fetch(C.SHEET_URL, {method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(res)})
      .then(function () { st.textContent = 'Score recorded! Watch the big screen for the rankings.'; })
      .catch(function () { st.textContent = 'Could not reach the leaderboard. Show this screen to a volunteer.'; });
  }

  function show(r, bp, tp, unmet, final) {
    var o = document.getElementById('sqResult'); if (o) o.remove();
    o = document.createElement('div'); o.id = 'sqResult';
    var h = '<div class="sqbox"><div class="sqk">' + (r.timedOut ? "TIME'S UP" : r.success ? 'MISSION SUCCESS' : 'LAUNCH FAILED') + '</div>';
    h += '<h2></h2>';
    if (r.success) {
      h += '<div class="sqscore">' + r.score + '<small>/100</small></div><table><tr><td>Budget saved (' + r.cost + ' of ' + r.budget + ' credits used)</td><td>' + bp + '</td></tr><tr><td>Time left (' + fmt(r.timeLeft) + ')</td><td>' + tp + '</td></tr></table>';
    } else {
      h += '<p>Your satellite did not make it to orbit' + (r.timedOut ? ' before time ran out' : '') + '. Still missing:</p><ul>' + unmet.map(function (u) { return '<li>' + u + '</li>'; }).join('') + '</ul>';
      if (final) h += '<div class="sqscore">0<small>/100</small></div>';
    }
    h += '<p id="sqSubmit" class="sqmuted"></p><div class="sqbtns">';
    h += final ? '<a class="sqbtn" href="index.html" id="sqNew">Done</a>' : '<button class="sqbtn" id="sqBack">Back to builder</button>';
    o.innerHTML = h + '</div></div>'; document.body.appendChild(o);
    o.querySelector('h2').textContent = r.team;
    var b = document.getElementById('sqBack'); if (b) b.onclick = function () { o.remove(); location.hash = '#rocket'; };
    var n = document.getElementById('sqNew'); if (n) n.onclick = function () { localStorage.removeItem('sq_team'); localStorage.removeItem('sq_start'); localStorage.removeItem('sq_done'); };
  }
})();
