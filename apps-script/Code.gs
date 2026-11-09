// SAT QUEST leaderboard backend. Paste into Extensions > Apps Script of your Google Sheet.
var TAB = 'Scores';
function tab_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName(TAB);
  if (!s) { s = ss.insertSheet(TAB); s.appendRow(['Received','Team','Score','Cost','Budget','TimeLeftSec','ElapsedSec','Success','TimedOut']); }
  return s;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function safe_(t) { t = String(t || '').substring(0, 40); return /^[=+\-@]/.test(t) ? "'" + t : t; }
function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents), s = tab_(), rows = s.getDataRange().getValues();
    var team = safe_(d.team);
    if (!team) return out_({ok: false, error: 'no team'});
    for (var i = 1; i < rows.length; i++) if (String(rows[i][1]).toLowerCase() === team.toLowerCase()) return out_({ok: false, error: 'duplicate'});
    s.appendRow([new Date(), team, Number(d.score) || 0, Number(d.cost) || 0, Number(d.budget) || 0, Number(d.timeLeft) || 0, Number(d.elapsed) || 0, !!d.success, !!d.timedOut]);
    return out_({ok: true});
  } finally { lock.releaseLock(); }
}
function doGet() {
  var rows = tab_().getDataRange().getValues().slice(1).map(function (r) {
    return {team: r[1], score: r[2], cost: r[3], budget: r[4], timeLeft: r[5], elapsed: r[6]};
  });
  rows.sort(function (a, b) { return b.score - a.score || a.cost - b.cost || a.elapsed - b.elapsed; });
  return out_({ok: true, rows: rows});
}
