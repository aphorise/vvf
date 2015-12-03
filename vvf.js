#!/usr/bin/env node
var f_SysT1=Date.now()/1000; //start time for measuring init times
var f_SysT2 = 0; //tick time for measuring last loop run.
var sPROJECT="vvf v0.0.1";
var UID; /*shorthand undefined*/
var bTTY = Boolean(process.stdout.isTTY) || (UID !== process.env.TERM && "xterm-256color" === process.env.TERM) ; // execution in terminal?
function sRaw(msg) { return bTTY ? msg : msg.replace( /\033\[[0-9;]*m/g, "" ); } /* strip TTY ANSI colours for no TTY */
var sCR=""+sRaw("\033[31m"),/*Red*/ sCC=""+sRaw("\033[36m");/*Cyan*/
var sCDG=""+sRaw("\033[90m"),/*Dark Gray*/ sCG=""+sRaw("\033[32m");/*Green*/
var sCN=""+sRaw("\033[0m"),/*Natural*/ sCNB=""+sRaw("\033[1m");/*Natural Bold*/
var sCP=""+sRaw("\033[35m"),/*Purple*/ sCY=""+sRaw("\033[33m");/*Yellow*/
var sCRBG=""+sRaw("\033[41");/*Red BG + White Text*/
var sL = sCNB + "\n@========================================@" + sCN; /* Line for TUI */
var sMsgWelcome = sCG + "\nSTARTED " + sCN + sCNB + sPROJECT + sCN + " @ " + new Date() + "\n";
var sMsgInit = sCP + "System ININT " + sCN + sCNB + "in: " + sCG + "%s" + sCN + " seconds";
var sEXITs = ["exit", "SIGHUP", "SIGUSR1", "SIGTERM", "SIGPIPE", "SIGINT", "SIGBREAK", "SIGWINCH", "uncaughtException"];
var sEFFMPG = "Output file is empty, nothing was encoded (check -ss / -t / -frames parameters if used)";
/* rgx scheme of all video file extensions expected */
var rgxFilesVideo = /(\.avi$|\.m4v$|\.mkv$|\.mov$|\.mp4$|\.mpg$|\.mpeg$|\.qt$)/;
var iTimeOut = 5000;
var iReadTicks = 0;
var allFiles = []; var oldFiles = [];
var sJSONALL="wmfs.json";
var sJSONDEL="wmfs_del.json";
var allErrorFfmpeg = []; // to reduce error warnings of same file on rerun.
var bUnchanged = false; // for reduced display
var iLogFactor=7; // ++ for reduced log where no change
var iLogMod=7; // constant mod comparison for log outout
var bSingle=true; // single run / execution instead of indefinite.
var sPATH="."; //PATH that will be scanned defauilt .
var bForked = false;
function log(msg) { process.stdout.write(msg); }
var fs, path, ps, crypto;
try
{
	fs = require("fs");
	path = require("path");
	crypto = require("crypto");
	ps = require("child_process");
	process.on("message", signalIn);
	exports = module.exports = { "initLoad" : initLoad } ;
}
catch (e){ log("Error loading: "+sPROJECT+e); }
function getFileRealPath(s){ try {return fs.realpathSync(s);} catch(e){return false;} }
function signalIn(msg)
{
	if (UID === msg || UID === msg.cmd) { return process.send({"error" : { "msg": "Request / string not understood." }}); }
	if(msg.cmd == "start")
	{
		bForked = true;
		for (var iX=0; iX<sEXITs.length; ++iX){ process.on(sEXITs[iX], function(i) { destruct(i); }); }
		process.send({"data" : { "msg": "OK" }});
		return initLoad(msg);
	}
	else { return process.send({"error" : { "msg": "Do not understand command passed." }}); }
}

function destruct(iCode)
{	/* on definable exit codes show msg */
	if (UID === iCode) return ; 
	var sQUIT="\nEXITING with: `"+sEXITs[iCode]+sCC+" code:"+iCode;
	sQUIT+="\nTSR "+sCNB+"Time"+sCN+" in Seconds: " +sCNB+(Date.now()/1000-f_SysT1).toString()+sCN+"\n";
	log(sQUIT);
}

function sortFilesAsending(a, b) { return parseFloat(a.size)-parseFloat(b.size); }

function findInFilesList(aSpace, k1, v1, k2, v2)
{
	for (var i=0; i < aSpace.length; ++i) { if (aSpace[i][k1] === v1 && aSpace[i][k2] === v2) { return i; } }
	return -1;
}

function updateFsTree(aFTree, sFile, aFTreeOld)
{
	if (!bIterative)
	{
		if (null === sFile.match(rgxFilesVideo)) { return ; /*log("Skipped: %s", sFile);*/ }
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
		if (0 >= iHead && 0 >= iTail) { log("ISSUE doing sha256 on: "+sFile); return ; }

		var sSha = crypto.createHash("sha256").update(sHeadTail.toString()).digest("hex");
		var iPos = findInFilesList(aFTreeOld, "path", sFile, "sha", sSha);
		if (-1 === iPos)
		{	/* attempt to get HH:MM:SS time truncating .xxx & decrementing by 1 second using date utility */
			var sTime='sTime=$(ffprobe -i \"'+sFile;
			sTime+='\" -select_streams v -show_streams 2>&1 | grep Duration | awk -F\': \' \'{print $2}\' | awk -F\', \' \'{print $1}\'); t=$(date -d $sTime +%s) ; ((--t)) ; ((--t)) ; printf \'%(%T)T\' $t' ;
			var psFF = ps.spawnSync("bash", ["-c",sTime ]);
			var ioFF = psFF.stdout.toString();
			var erFF = psFF.stderr.toString();
			if (0 !== erFF.length)
			{
				if (UID === allErrorFfmpeg[sFile] && erFF !== allErrorFfmpeg[sFile])
				{
					log("Ignoring "+sCR+"BAD"+sCN+" file: "+sCN+sFile+sCDG+erFF+sCN);
					allErrorFfmpeg[sFile] = erFF;
				}
				return ;
			}
			/* Next we'll reconfirm file using ffmpeg to encode 1frame from end time - 1 seconds */
			var sEncode='ffmpeg -threads $(nproc) -ss '+ioFF+' -i \"'+sFile + '\" -frames:v 1 -f null /dev/null';
			var psFFMPEG = ps.spawnSync("bash", ["-c", sEncode]);
			var ioFFFPEG = psFFMPEG.stdout.toString();
			var erFFMPEG = psFFMPEG.stderr.toString();
			if (-1 !== erFFMPEG.indexOf(sEFFMPG) || -1 !== erFFMPEG.indexOf(": No such file or directory"))
			{
				if (UID === allErrorFfmpeg[sFile] && erFFMPEG !== allErrorFfmpeg[sFile])
				{
					aLs = erFFMPEG.split("\n");
					aLs = aLs[aLs.length-2];
					log("Video "+sCR+"NOT READY"+sCN+": "+sCN+sFile+" "+sCDG+aLs+sCN+"\n");
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
	} catch(e){ log(e+"\n"); }
}

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

function GetFilesIteratively(sDir, aFileTree, aFTreeOld)
{
	var exts = "-name '*.avi' -o -name '*.mp4' -o -name '*.m4v' -o -name '*.mpg'";
	exts+= " -o -name '*.mpeg' -o -name '*.mkv' -o -name '*.mov' -o -name '*.qt'";
	var toRun = "find "+sDir+" -type f \\( " + exts + " \\)"; 
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
		if (0 !== oldModified.length)
		{	/* 0 means no deletion - only addition. Append to deleted list */
			fs.appendFileSync
			(
				sJSONDEL, JSON.stringify(oldModified)//, "utf8",// function (err) { return log(err?err:"\nSuccess - wrote DELETED to file: "+sJSONDEL);}
			);
		}
		fs.writeFileSync(sJSONALL, JSON.stringify(allFiles));
		oldFiles = allFiles;
		bUnchanged = false;
		iLogFactor=iLogMod;
	}
	if (!bUnchanged) { log(msg); }
	f_SysT2=Date.now()/1000;
}

var bIterative = true;

/* loads former files collected on last run or before crash / stop */
function initLoad(oRequest)
{	// measuring init times here
	var fSecs=Date.now()/1000-f_SysT1;
	log(sMsgWelcome)
	console.log(sMsgInit, fSecs, sL);
	log("\nStarted 1st read @: "+new Date()+"\n");

	if (UID !== oRequest)
	{
		bSingle = (UID === oRequest.s && UID === oRequest.f) || UID === oRequest.f ;
		if (UID !== oRequest.oa) { sJSONALL = oRequest.oa; }
		if (UID !== oRequest.od) { sJSONDEL = oRequest.od; }
		if (UID !== oRequest.path) { sPATH = oRequest.path; }
		bSingle = UID === oRequest.f;
		bIterative = UID === oRequest.li;
	}

	if (getFileRealPath(sJSONALL))
	{
		var oldReads = fs.readFileSync(sJSONALL, "utf8")
		if (2 < oldReads.length) { oldFiles = JSON.parse(oldReads); log("\nReloaded OLD JSON.\n"); }
	}
	if (!bSingle)
	{	// reset allFiles array & restart read indefinitely
		while (1)
		{
			allFiles = []; startReadingFS(sPATH); ++iReadTicks;
			if (bForked) { process.send({"data" : { "files": allFiles }}); }
			else return {"data" : { "files": allFiles }};
		}
	}
	else
	{
		allFiles = []; startReadingFS(sPATH); ++iReadTicks;
		if (bForked) { process.send({"data" : { "files": allFiles }}); }
		else return {"data" : { "files": allFiles }};
	}
}
//initLoad();
