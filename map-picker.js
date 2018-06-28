// The guts of the map-picker interface.
// Author: dan.bush@gmail.com

// GLOBALS
var _maps;   // contains Map objects
var _picks;  // contains Pick objects

// OBJECT Map
function Map(id,name,longName,mod,types,quote)
{
 this.id = id;
 this.name = name
 this.longName = longName;
 this.mod = mod;
 this.types = types;
 this.quote = quote;
}

// OBJECT Pick
function Pick(mapId, typeIdx)
{
 this.mapId = mapId;
 this.typeIdx = typeIdx;
}

function getArenaData(url)
{
    if (window.XMLHttpRequest) {
        req = new XMLHttpRequest();
        //req.onreadystatechange = processReqChange;
        req.open("GET", url, false);
        req.send(null);
        return req.responseText;
    // branch for IE/Windows ActiveX version
    } else if (window.ActiveXObject) {
        isIE = true;
        req = new ActiveXObject("Microsoft.XMLHTTP");
        if (req) {
            //req.onreadystatechange = processReqChange;
            req.open("GET", url, false);
            req.send();
            return req.responseText;
        }
    }
}

//function processReqChange() {
//    // only if req shows "loaded"
//    if (req.readyState == 4) {
//        // only if "OK"
//        if (req.status == 200) {
//            // ...processing statements go here...
//        } else {
//            alert("There was a problem retrieving the XML data:\n" +
//                req.statusText);
//        }
//    }
//}

// init()  --------------------------------------------------------------------
//
// initilize
//
function init()
{
// init maps
//alert("init");
_maps = new Array();

// load arena.data
//objXml = new XMLHttpRequest();
//objXml.open("GET","arena.data",false);
//objXml.send(null);
//data = objXml.responseText;
data = getArenaData('arena.data');

// traverse records
records = data.split("|");
for (r in records)
{
// unpack record
record = records[r].split(",");
// create Map
map = new Map(r,record[0],record[1],record[4],record[2],record[03])
_maps.push(map);
}

// init picks
_picks = new Array();

//alert('loaded '+_maps.length+' maps');
//alert("DONE init");
}

// getMaps()  -----------------------------------------------------------------
//
// returns all known maps
//
function getMaps() { return _maps; }

// search () ------------------------------------------------------------------
// 
// execut search
//
function search()
{
//alert("searching ...");

// search criteria
query = document.search.query.value;
qmod = document.search.qmod.value;
qtype = document.search.qtype.value;
//alert('query:['+query+'] qmod:['+qmod+'] qtype:['+qtype+']');

// holds search results
results = new Array();

// search maps
for (m in getMaps())
{
map = _maps[m];

// collect matches
if (

// qeuery string is null/undefined or '' || matches map.name || matches map.longName || matches quote
(!query || query == '' || map.name.search(query, 'i') != -1 || map.longName.search(query, 'i') != -1 || map.quote.search(query, 'i') != -1)

// qtype is 'ALL' "| mathces an actual map type
&& ((qtype == 'ALL' || map.types.match(qtype))) 

// qmode is 'ALL' || matches an actual mod name
&& (qmod == 'ALL' || map.mod.match(qmod)))
{
results.push(map);
}
}
// show results
//alert(results);
displaySearchResults(results);
//alert("DONE search");
}

// displaySearchResults() -----------------------------------------------------
//
// displays search results in the main window
//
function displaySearchResults(maps)
{
if (!maps || maps.length <= 0)
{
setContent("<br/><br/><center><font color=\"red\"><h2><i>No results ...</i></h2></font></center>");
}
else
{
searchResults = '<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\">';
for (m in maps)
{
map = maps[m];
types = map.types;
types = types.split(" ");
searchResults += '<tr><td><table border=\"0\" class=\"'+(m%2 == 0 ? 'even' : 'odd')+'\"><tr><td><table><tr><td><a target=\"_blank\"href=\"levelshots/'+map.name+'.jpg\"><img src=\"levelshots/'+map.name+'.jpg\" height=\"200\" width=\"200\" onerror="this.src=\'q3a.jpg\';"/></a></td><td width=\"350\"><table border=\"0\"><tr><td><b>'+map.name+'</b></td></tr><tr><td>'+map.longName+'</td></tr><tr><td>';
for (t in types)
{
searchResults += '<a href=\"javascript:top.ctrl.pickMap(\''+map.id+'\',\''+t+'\')\">'+types[t]+'</a>&nbsp;&nbsp;';
}
searchResults += '</td><tr><td>'+map.mod+'</td><tr><td><i>'+map.quote+'</i></td></tr></table></td></tr></table></td></tr></table></td></tr>';
}
searchResults += '</table>';
setContent(searchResults);
}
}

// setContent() ---------------------------------------------------------------
//
// sets the content of the main frame
//
function setContent(content) { top.main.document.getElementById('content').innerHTML = content; }

// resetContent() -------------------------------------------------------------
//
// resets the content of the main frame
//
function resetContent() { setContent(''); }

// pickMap() ------------------------------------------------------------------
//
// adds map to _picks
//
function pickMap(mapId, typeIdx)
{
_picks.push(new Pick(mapId, typeIdx));
showPicks();
}

// showPicks() ----------------------------------------------------------------
//
// updates the picks frame content
//
function showPicks()
{
content = '<table border=\"0\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">';
for (p in _picks)
{
pick = _picks[p];
map = _maps[pick.mapId];

content += '<tr><td><table width=\"100%\" border=\"0\" class=\"'+(p%2 == 0 ? 'even' : 'odd')+'\"><tr><td><table border=\"0\"><tr><td><a target=\"_blank\"href=\"levelshots/'+map.name+'.jpg\"><img src=\"levelshots/'+map.name+'.jpg\" height=\"90\" width=\"90\" /></a></td><td width=\"100%\"><table width=\"100%\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"right\"><a href=\"javascript:top.ctrl.promotePick('+p+')\">up</a>&nbsp;/&nbsp;<a href=\"javascript:top.ctrl.demotePick('+p+')\">down</a></td></tr><tr><td>&nbsp;</td></tr><tr><td align=\"center\"><b>'+map.name+'</b></td></tr><tr><td align=\"center\">';

// game types
types = map.types.split(' ');
for (t in types)
{
if (t == pick.typeIdx)
{
content += '<b>'+types[t]+'</b>&nbsp;';
}
else
{
content += '<a href=\"javascript:top.ctrl.changeType('+p+', '+t+')\">'+types[t]+'</a>&nbsp;';
}
}

content += '</td></tr><tr><td>&nbsp;</td></tr><tr><td align=\"center\">(<a href=\"javascript:top.ctrl.delPick('+p+')\">remove</a>)</td></tr></table></td></tr></table></td></tr></table></td></tr>';
}
content += '</table>';
top.picks.document.getElementById('picks').innerHTML = content;	
}

// delPick() ------------------------------------------------------------------
//
// deletes the specified pick
//
function delPick(idx)
{
//if (confirm("Confirm delete!"))
//{
newPicks = new Array();
for (p in top.ctrl._picks)
{
if (p != idx)
{
newPicks.push(top.ctrl._picks[p]);
}
}
top.ctrl._picks = newPicks;
top.ctrl.showPicks();
//top.ctrl.resetContent();
}
//}

// demotePick() ---------------------------------------------------------------
//
// demotes the sepecified pick in the pick list
function demotePick(idx)
{
if (idx == top.ctrl._picks.length-1)
{
//alert('Can\'t demote any further!');
tmp = top.ctrl._picks.pop();
top.ctrl._picks.unshift(tmp);
}
else
{
tmp = top.ctrl._picks[idx];
top.ctrl._picks[idx] = top.ctrl._picks[idx+1];
top.ctrl._picks[idx+1] = tmp;
}
top.ctrl.showPicks();
//top.ctrl.resetContent();
}

// promotePick() --------------------------------------------------------------
//
// promotes the specified pick in the pick list
//
function promotePick(idx)
{
if (idx == 0)
{
//alert('Can\'t promote any further!');
tmp = top.ctrl._picks.shift();
top.ctrl._picks.push(tmp);
}
else
{
tmp = top.ctrl._picks[idx];
top.ctrl._picks[idx] = top.ctrl._picks[idx-1];
top.ctrl._picks[idx-1] = tmp;
}
top.ctrl.showPicks();
//top.ctrl.resetContent();
}

// dumpPicks() ----------------------------------------------------------------
//
// dumps the pick list
//
function dumpPicks()
{
if (!top.ctrl._picks || top.ctrl._picks.length == 0) 
{
alert("No maps have been selected!");
return;
}
picksStr = '';
for (p in top.ctrl._picks)
{
pick = top.ctrl._picks[p];
picksStr += pick.mapId+','+pick.typeIdx;
if (p<top.ctrl._picks.length-1) { picksStr += '|'; }
}
top.ctrl.setContent(picksStr);
}

// clearPicks() ---------------------------------------------------------------
//
// clears the pick list
//
function clearPicks()
{
top.ctrl._picks = new Array();
top.ctrl.showPicks();
}

// genRotation() --------------------------------------------------------------
//
// generates a map rotation from the current picks
//
function genRotation()
{
if (!_picks || _picks.length == 0) 
{
//alert("No maps have been selected!");
//return;
genRandomPicks();
}
resetContent();
timelimit = prompt("Time Limit:", "15");
if (!timelimit) { timelimit = '15'; }
capturelimit = prompt("Capture Limit", "8");
if (!capturelimit) { capturelimit = '8'; }

content = '// ***      Auto-generated by map-picker      ***\n'
	+ '//\n'
	+ '// Date: '+new Date()+'\n// Author: dan.bush@gmail.com\n'
	+ '\n';
//content += 'timelimit '+timelimit+'\n';
//content += 'capturelimit '+capturelimit+'\n\n';

for (p in _picks)
{
pick = _picks[p];
map = _maps[pick.mapId];
content +='set m'+p+' \"set g_gametype '+rectifyGameType(map.types.split(' ')[pick.typeIdx])+'; set timelimit '+timelimit+'; set capturelimit '+capturelimit+'; map '+map.name+'; set nextmap vstr m'+(p<_picks.length-1 ? ++p : 0)+'\"\n';
}
content += '\nvstr m0\n';
setContent('<textarea readonly rows=\"20\" cols=\"64\">'+content+'</textarea>');
}

// rectifyGameType() -----------------------------------------------------------
//
// resolves the actual game type
//
function rectifyGameType(type)
{
switch(type) {
case "FFA":
  return "0";
case "DM":
  return "1";
case "TDM":
  return "3";
case "CTF":
  return "4";
case "1FCTF":
  return "5";
case "CS":
  return "9";
case "CCTF":
  return "10";
default:
  alert('undefined game type:['+type+']!');
}
}

// genRandomPicks() -----------------------------------------------------------
//
// generates a random pick list
//
function genRandomPicks()
{
top.ctrl.clearPicks();
numMaps = prompt("How many random maps?", 8);
flagsOnly = confirm("Flags only (CTF, CCTF, CS, 1FCTF)?");
maps2 = (flagsOnly ? top.ctrl.getMapsWithFlags() : top.ctrl.getMaps()); 
for (i=0; i<numMaps; i++)
{
randMap = Math.floor(Math.random()*maps2.length+1)-1;
map2 = maps2[randMap];
types2 = map2.types.split(' ');
randType = Math.floor(Math.random()*types2.length+1)-1;
top.ctrl._picks.push(new Pick(getMapIdx(map2.name), randType));
}
top.ctrl.showPicks();
top.ctrl.resetContent();
}

// changeType() ---------------------------------------------------------------
//
// changes the pick game type
//
function changeType(pickIdx, typeIdx)
{
top.ctrl._picks[pickIdx].typeIdx = typeIdx;
top.ctrl.showPicks();
top.ctrl.resetContent();
}

// getMapsWithFlags() ---------------------------------------------------------
//
//
//
function getMapsWithFlags()
{
ret = new Array();
maps = getMaps();
for (m in maps)
{
map = maps[m];
types = map.types;
if (types.indexOf('CTF') != -1)
{
ret.push(map);
}
}
return ret;
}

function getMapIdx(mapName)
{
maps = getMaps();
for (m in maps)
{
map = maps[m];
if (map.name == mapName)
{
return m;
}
}
}
