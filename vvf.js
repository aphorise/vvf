#!/usr/bin/env node
var f_SysT1=Date.now()/1000; /** start time for measuring init times */
var f_SysT2 = 0; /** tick time for measuring last loop run. */
var sPROJECT="vvf v0.0.2";
var UID; /** shorthand undefined */
/** Global level log function equvilant to console.log @param String message to display */
var fs, path, ps, crypto, tty;
try
{
	tty = require("tty");
	fs = require("fs");
	path = require("path");
	crypto = require("crypto");
	ps = require("child_process");
	process.on("message", signalIn);
	exports = module.exports =
	{ "initLoad" : initLoad, "sortFilesAsending" : sortFilesAsending , "destruct" : destruct };
}
catch (e){ console.log("Error loading: "+sPROJECT+e); }
/** in TTY Terminal? */
function log(msg) { process.stdout.write(msg); }
var bTTY = Boolean(process.stdout.isTTY) || (UID !== process.env.TERM && "xterm-256color" === process.env.TERM) ; // execution in terminal?
function sRaw(msg) { return bTTY ? msg : msg.replace( /\033\[[0-9;]*m/g, "" ); } /* strip TTY ANSI colours for no TTY */
var sCR=""+sRaw("\033[31m"),/**Red*/ sCC=""+sRaw("\033[36m");/**Cyan*/
var sCDG=""+sRaw("\033[90m"),/**Dark Gray*/ sCG=""+sRaw("\033[32m");/**Green*/
var sCN=""+sRaw("\033[0m"),/**Natural*/ sCNB=""+sRaw("\033[1m");/**Natural Bold*/
var sCP=""+sRaw("\033[35m"),/**Purple*/ sCY=""+sRaw("\033[33m");/**Yellow*/
var sCRBG=""+sRaw("\033[41");/**Red BG + White Text*/
var sL = sCNB + "\n@========================================@" + sCN; /* Line for TUI */
var sMsgWelcome = sCG + "\nSTARTED " + sCN + sCNB + sPROJECT + sCN + " @ " + new Date() + "\n";
var sMsgInit = sCP + "System ININT " + sCN + sCNB + "in: " + sCG + "%s" + sCN + " seconds";
var sEXITs = ["exit", "SIGHUP", "SIGUSR1", "SIGTERM", "SIGPIPE", "SIGINT", "SIGBREAK", "SIGWINCH", "uncaughtException"];
/* var sEXITs = [ "exit", "SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT", "SIGIOT", "SIGBUS", "SIGFPE", "SIGKILL",
 "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGPIPE", "SIGALRM", "SIGTERM", "SIGCHLD", "SIGSTKFLT", "SIGCONT", "SIGSTOP",
 "SIGTSTP", "SIGBREAK", "SIGTTIN", "SIGTTOU", "SIGURG", "SIGXCPU", "SIGXFSZ", "SIGVTALRM", "SIGPROF", "SIGWINCH",
 "SIGIO", "SIGPOLL", "SIGLOST", "SIGPWR", "SIGSYS", "SIGUNUSED" ]; */
var sEFFMPG = "Output file is empty, nothing was encoded (check -ss / -t / -frames parameters if used)";
var iTimeOut = 5000;
var iReadTicks = 0;
var allFiles = []; var oldFiles = [];
var sJSONALL="vvf.json"; var sJSONDEL="vvf_del.json";
var allErrorFfmpeg = []; /** to reduce error warnings of same file on rerun. */
var bUnchanged = false; /** for reduced display */
var iLogFactor=7; /** ++ for reduced log where no change */
var iLogMod=7; /** constant mod comparison for log outout */
var bSingle=true; /** single run / execution instead of indefinite. */
var sPATH="."; /** PATH that will be scanned defauilt . */
var bForked = false; var bIterative = true;
var bNoFile = false; var bQuiet = false;
/** all default video extensions expected */
var aFileExensions =
[
"3gp", "3gp2", "264", "amv", "asf", "avi", "bik", "dv", "divx", "f4v", "flv", "gvi", "m2t",
"m2ts", "m2v", "m4v", "mkv", "mov", "mp2", "mp2v", "mp4", "mp4v", "mpeg", "mpeg2", "mpeg4",
"mpg", "mxg", "mtv", "nsv", "nuv", "rec", "rm", "rmvb", "rpl", "ogg", "ogm", "ogv","ogx",
"ps", "qt", "swf", "vob", "webm", "wmv", "xvid", "wtv"
];
/** Quit / Ending Message to display for time taken, etc. @param Number integer exit code. */
function destruct(iCode)
{	/* on definable exit codes show msg */
	if (UID === iCode) return ; 
	var sQUIT= 0 !== iCode ? "\nEXITING with: "+sCC+sEXITs[iCode]+sCN+" code: "+sCC+iCode : ""+sCN;
	sQUIT+="\nTSR "+sCNB+"Time"+sCN+" in Seconds: " +sCNB+(Date.now()/1000-f_SysT1).toString()+sCN+"\n";
	if (!bQuiet) { log(sQUIT); }
}
/** Regular expression String-Escape function @param string the string to be modified */
function RegExpEscape(string){ return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
/** rgx scheme of all video file extensions expected */
var rgxFileExensions= RegExp();
/** find related file extensions */
var sFileExensions= "";
/** checks for existance of path at given path @param String file path. */
function getFileRealPath(s){ try {return fs.realpathSync(s);} catch(e){return false;} }
/** General sort function by file size to be used to returned_array.sort(sortFilesAsending). */
function sortFilesAsending(a, b) { return parseFloat(a.size)-parseFloat(b.size); }
/** Forked process function for incoming request / initialiser @param Object API like request object. */
function signalIn(msg)
{
	if (UID === msg || UID === msg.cmd) { return process.send({"error" : { "msg": "Request / string not understood." }}); }
	if(msg.cmd == "start")
	{
		bForked = true;
		process.send({"data" : { "msg": "OK" }});
		return initLoad(msg);
	}
	else if (msg.cmd == "destruct") { process.exit(0);}
	else { return process.send({"error" : { "msg": "Do not understand command passed." }}); }
}
/** Checks in array for presence of existing instance with Key1 & Key2 being of required values. */
function findInFilesList(aSpace, k1, v1, k2, v2)
{
	for (var i=0; i < aSpace.length; ++i) { if (aSpace[i][k1] === v1 && aSpace[i][k2] === v2) { return i; } }
	return -1;
}
/** Add to Array FS-Tree based on criteria using old Array of FS-Tree as comparison. */
function updateFsTree(aFTree, sFile, aFTreeOld)
{
	if (!bIterative)
	{
		if (null === sFile.match(rgxFileExensions)) { return ; /*log("Skipped: %s", sFile);*/ }
	}
	try
	{
		var stats = fs.statSync(sFile);
		var iFileSize = stats["size"];
		var sHeadTail = new Buffer(512);
		var fd = fs.openSync(sFile, "r");
		var iHead = fs.readSync(fd, sHeadTail, 0, 256, null);
		var iB = iFileSize-256;
		var iTail = fs.readSync(fd, sHeadTail, 256, 256, iB);
		fs.closeSync(fd, "r");
		if (0 >= iHead && 0 >= iTail) { if (!bQuiet) { log("ISSUE doing sha256 on: "+sFile); } return ; }

		var sSha = crypto.createHash("sha256").update(sHeadTail.toString()).digest("hex");
		var iPos = findInFilesList(aFTreeOld, "path", sFile, "sha", sSha);
		if (-1 === iPos)
		{	/* attempt to get HH:MM:SS time truncating .xxx & decrementing by 1 second using date utility */
			var sTime='sTime=$(ffprobe -i "'+sFile;
			sTime+='" -select_streams v -show_streams 2>&1 | grep Duration | awk -F": " \'{print $2}\' | awk -F", " \'{print $1}\'); IFS=:. read -r H M S R <<< "$sTime" ; ((s = 10#$H * 3600 + 10#$M * 60 + 10#$S)) ; ((s -= 1)) ; ((h = s / 3600, s %= 3600)) ; ((m = s / 60, s %= 60)) ; printf %02d:%02d:%02d.%s $h $m $s $R' ;
			var psFF;
			if (process.platform === "win32") { psFF = ps.spawnSync("bash", ["-c", sTime]); }
			else { psFF = ps.spawnSync("bash", ["-c", sTime], {env: {"LC_ALL":"C"}}); }
			var ioFF = (null !== psFF.stdout) ? psFF.stdout.toString() : "";
			var erFF = (null !== psFF.stderr) ? psFF.stderr.toString() : "";
			if (0 !== erFF.length || -1 !== ioFF.indexOf("-"))
			{
				
				if (UID === allErrorFfmpeg[sFile] && erFF !== allErrorFfmpeg[sFile])
				{
					if (!bQuiet)
					{
						if (-1 !== ioFF.indexOf("-"))
						{ log("Ignoring "+sCR+"EMPTY"+sCN+" file: "+sCDG+sFile+sCN+"\n"); }
						else
						{ log("Ignoring "+sCR+"BAD"+sCN+" file: "+sCN+sFile+sCDG+erFF+sCN); }
					}
					allErrorFfmpeg[sFile] = erFF;
				}
				return ;
			}

			/* Next we'll reconfirm file using ffmpeg to encode 1frame from end time - 1 seconds */
			var sEncode='ffmpeg -threads $(nproc) -ss '+ioFF+' -i \"'+sFile + '\" -frames:v 1 -f null /dev/null';
			var psFFMPEG;
			if (process.platform === "win32") { psFFMPEG = ps.spawnSync("bash", ["-c", sEncode]); }
			else { psFFMPEG = ps.spawnSync(sEncode); }

			var ioFFFPEG = (null !== psFFMPEG.stdout) ? psFFMPEG.stdout.toString() : "";
			var erFFMPEG = (null !== psFFMPEG.stderr) ? psFFMPEG.stderr.toString() : "";

			if (-1 !== erFFMPEG.indexOf(sEFFMPG) || -1 !== erFFMPEG.indexOf(": No such file or directory"))
			{
				if (UID === allErrorFfmpeg[sFile] && erFFMPEG !== allErrorFfmpeg[sFile])
				{
					aLs = erFFMPEG.split("\n");
					aLs = aLs[aLs.length-2];

					if (!bQuiet) { log("Video "+sCR+"NOT READY"+sCN+": "+sCN+sFile+" "+sCDG+aLs+sCN+"\n"); }
					allErrorFfmpeg[sFile] = aLs;
				}
				return ;
			}
			var oFile =
			{
				"path": sFile, "size": iFileSize,
				"sha": sSha , "duration" : ioFF,
				"encoded": false, "deleted": false, 
			};
			aFTree.push(oFile);
		}
		else { aFTree.push(aFTreeOld[iPos]); /*log(sFile+" exists / already in array.\n");*/ }
	} catch(e){ if (!bQuiet) { log(e+"\n"); } }
}
/** Goes through entire FS tree using fs.readdirSync */
function GetFilesRecursively(sDir, aFileTree, aFileTreeOld)
{
	var files = fs.readdirSync(sDir);
	files.forEach(function(file)
	{
		f = fs.statSync(sDir+path.sep+file);
		if (f.isDirectory()) { GetFilesRecursively(sDir+path.sep+file, aFileTree, aFileTreeOld); }
		else { updateFsTree(aFileTree, sDir+path.sep+file, aFileTreeOld); }
	});
	return ; 
}
/** Uses find command to get entire fs tree */
function GetFilesIteratively(sDir, aFileTree, aFTreeOld)
{
	var toRun = "find "+sDir+" -type f \\( " + sFileExensions + " \\)"; 
	/* Iterative Method using find to get listing first then parse. */
	var z = ps.execSync(toRun, {timeout: iTimeOut, encoding: "utf8"});
	var theFiles = z.split("\n");
	for (var iX=0; iX < theFiles.length-1; ++iX) { updateFsTree(aFileTree, theFiles[iX], aFTreeOld); }
}

function startReadingFS(sPath)
{
	if (bIterative) { GetFilesIteratively(sPath, allFiles, oldFiles); }
	else { GetFilesRecursively(sPath, allFiles, oldFiles); }

	if (0 === allFiles.length) { allFiles = oldFiles; }
	if (iReadTicks%iLogFactor === iLogFactor-1) { bUnchanged = false; iLogFactor*=2; }
	else bUnchanged = true;
	bUnchanged = f_SysT2 === 0 ? false : bUnchanged;
	var fSecs = Date.now()/1000-(f_SysT2 === 0 ? f_SysT1 : f_SysT2);
	var msg = sCC+allFiles.length+sCN+" <-- video files scaned compared to old read --> "+sCG+oldFiles.length+sCN;
	msg+=" ("+sCDG+"took: "+sCN+sCNB+fSecs+sCN+" seconds)"+sL;
	if (!bSingle) { msg+="\n\nRestarting read @: "+new Date()+"\n\n"; }

	/* bad / cheap string comparison */
	if (allFiles.toString() === oldFiles.toString())
	{
		var sTmp ="\n.... FS-TREE unchanged @: "+sCP+(iReadTicks+1)+sCN+" reads";
		msg = (iLogMod === iLogFactor) ? sTmp+"\n"+msg+"\n" : sTmp;
	}
	else
	{
		msg= "\n.... FS-TREE CHANGED / MODIFIED.\n"+msg;
		var oldModified = []; 
		for (var iX=0; iX < oldFiles.length; ++iX)
		{
			var iPos = findInFilesList(allFiles, "path", oldFiles[iX].path, "sha", oldFiles[iX].sha);
			if (-1 === iPos)
			{
				oldFiles[iX].deleted = true;
				oldModified.push(oldFiles[iX]);
			}
		}
		if (!bNoFile)
		{
			if (0 !== oldModified.length)
			{	/* 0 means no deletion - only addition. Append to deleted list */
				fs.appendFileSync
				(
					sJSONDEL, JSON.stringify(oldModified)
					//, "utf8",// function (err) { return log(err?err:"\nSuccess - wrote DELETED to file: "+sJSONDEL);}
				);
			}
			fs.writeFileSync(sJSONALL, JSON.stringify(allFiles));
		}
		oldFiles = allFiles;
		bUnchanged = false;
		iLogFactor=iLogMod;
	}
	if (!bUnchanged) { if(!bQuiet) { log(msg); } }
	f_SysT2=Date.now()/1000;
}
/**---------------------------------------
 *  MAIN: Initialiser Function.
 * loads former files collected on last run
 * or before stop. @param Object request.
 *---------------------------------------*/
function initLoad(oRequest)
{	// measuring init times here
	var fSecs=Date.now()/1000-f_SysT1;
	for (var iX=0; iX<sEXITs.length; ++iX){ process.on(sEXITs[iX], function(i) { destruct(i); }); }

	if (UID !== oRequest)
	{
		bSingle = (UID === oRequest.s && UID === oRequest.f) || UID === oRequest.f ;
		if (UID !== oRequest.oa) { sJSONALL = oRequest.oa; }
		if (UID !== oRequest.od) { sJSONDEL = oRequest.od; }
		if (UID !== oRequest.path) { sPATH = oRequest.path; }
		if (UID !== oRequest.x) { aFileExensions = oRequest.x; }

		bNoFile = UID !== oRequest.nf;
		bSingle = UID === oRequest.w;
		bIterative = UID === oRequest.lr;
		bQuiet = UID !== oRequest.q;
	}

	var sExts = [];
	if (bIterative)
	{
		sExts.push("-iname '*."+aFileExensions[0]+"' ");
		for (var iX=1; iX < aFileExensions.length; ++iX) { sExts.push("-o -iname '*."+aFileExensions[iX]+"' "); }
		sFileExensions = sExts.join("");
	}
	else
	{
		for (var iX=0; iX < aFileExensions.length-1; ++iX) { sExts.push(RegExpEscape(aFileExensions[iX])+"|"); }
		if (1 > aFileExensions.length) { sExts.push(RegExpEscape(aFileExensions[aFileExensions.length-1])); }
		rgxFileExensions = RegExp("/\.(?:"+sExts.join("")+")$/");
	}

	if (!bQuiet)
	{
		log(sMsgWelcome);
		console.log(sMsgInit, fSecs, sL);
		log("\nStarted 1st read @: "+new Date()+"\n");
	}

	if (!bNoFile && getFileRealPath(sJSONALL))
	{
		var oldReads = fs.readFileSync(sJSONALL, "utf8")
		if (2 < oldReads.length)
		{
			oldFiles = JSON.parse(oldReads);
			if (!bQuiet) { log("\nReloaded OLD JSON.\n"); }
		}
	}

	if (!bSingle)
	{	// reset allFiles array & restart read indefinitely
		while (1)
		{
			allFiles = []; startReadingFS(sPATH); ++iReadTicks;
			if (!bUnchanged)
			{	/* CAN SORT too by size: allFiles.sort(sortFilesAsending); */
				if (UID !== oRequest.os) { log(JSON.stringify(allFiles)); }
				if (bForked){ process.send({"data" : { "files": allFiles }}); }
				else { /* return {"data" : { "files": allFiles }}; */ }
			}
		}
	}
	else
	{	/* CAN SORT too by size: allFiles.sort(sortFilesAsending); */
		allFiles = []; startReadingFS(sPATH); ++iReadTicks;
		if (UID !== oRequest.os) { log(JSON.stringify(allFiles)); }
		if (bForked) { process.send({"data" : { "files": allFiles }}); destruct(0); }
		else { return {"data" : { "files": allFiles }}; }
	}
}
//initLoad();

