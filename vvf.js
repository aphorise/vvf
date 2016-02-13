#!/usr/local/bin/node
var sVERSION = "v0.0.3";
var UID = undefined; /**shorthand undefined*/
//----------------------------------------------------------------
/* Packages Required: */
//----------------------------------------------------------------
var mVIPIFS, mFS;
try{ mFS = require("fs"); }
catch(e){ console.log("\nDid you -> npm install <- ?\n\n"+e); process.exit(1); }
/*----------------------------------------------------------------*/
var bTTY = Boolean(process.stdout.isTTY) || (UID !== process.env.TERM && "xterm-256color" === process.env.TERM);
function sRaw(msg) { return bTTY ? msg : msg.replace( /\033\[[0-9;]*m/g, "" ); } /* strip TTY ANSI colours for no TTY */
function is_int(value){ return (parseFloat(value) == parseInt(value)) && !isNaN(value); }
/*Red*/ var sCR=sRaw("\033[31m"); /*Cyan*/ var sCC=sRaw("\033[36m");
/*Dark Gray*/ var sCDG=sRaw("\033[90m"); /*Green*/ var sCG=sRaw("\033[32m");
/*Natural*/ var sCN=sRaw("\033[0m"); /*Bold Text*/ var sCNB=sRaw("\033[1m"); // **Blue*/ var sCB=sRaw("\x1b[34m"); *Purple*/var sCP=""+sRaw("\033[35m");/*Yellow*/var sCY=""+sRaw("\033[33m"); /*Red BG+White Text*/ var sCRBG=""+sRaw("\033[41");
var sUage=sCN+sCR+"╒══════"+sCG+"═══════"+sCC+"══════╕\n";
sUage+= sCN+sCR+"│"+sCNB+" Valid"+sCG+" Video"+sCC+" Files │\n";
sUage+= sCN+sCR+"╘══════"+sCG+"═══════"+sCC+"══════╛\n";
sUage+= sCN+"    "+sCNB+"vvf"+sCN+" - "+sCDG+sVERSION+"\n"+sCN;
var args =
[
/*0*/[["-h", "--help", "/?" ], "\t Shows this screen."],
/*1*/[["-f", "--forked", "/f" ], "Forked process. with -w continues beyond termination."],
/*2*/[["-li", "--iterative", "/li" ], "(default) Iterate over file-system using 'find'."],
/*3*/[["-lr", "--recursive", "/lr" ], "Recursively list file-system (regex match all files)."],
/*4*/[["-nf", "--nofiles", "/nf" ], "No file related output."],
/*5*/[["-oa=", "--outall=", "/oa=" ], "(default: vvf.json) All media files definition."],
/*6*/[["-od=", "--outdel=", "/od=" ], "(default: vvf_del.json) Deleted media files appended to."],
/*7*/[["-os", "--outstdio", "/os" ], "Output results.json (of all files) to stdio."],
/*8*/[["-q", "--quiet", "/q" ], "\t Quiet mode no error or default header output useful with -os."],
/*9*/[["-s", "--single", "/s" ], "(default) Single scan execution checking fs-tree once."],
/*10*/[["-u", "--unforked", "/u" ], "(default) Single none-forked or threaded sync process."],
/*11*/[["-v", "--version", "/v" ], "Output version information & exit."],
/*12*/[["-w", "--watch", "/w" ], "\t Watch file-system scanning indefinitely (forever)."],
/*13*/[["-x=", "--xtensions=", "/x=" ], "Insensitive comma separated list of file extensions (-x=av,dat)"],
/*14*/[["-zs=", "--zseconds=", "/zs=" ], "Use (minus) -X seconds from end of claimed time to validate file."]
];

function log(msg, iExitCode)
{
	process.stdout.write((UID !== iExitCode) ? "\n"+msg : msg); if (UID !== iExitCode) { process.exit(iExitCode); }
}

function getFileRealPath(s){ try {return mFS.realpathSync(s);} catch(e){return false;} }

var iArgsIn = 0;
var sArgs = "";
var iX;
for (iX=0; iX < args.length; ++iX){ sArgs+="\t"+sCN+args[iX][0].join(", ")+sCNB+"\t "+args[iX][1]+"\n"; }

function showHelp(msgExtra, iExitCode)
{
	sUage+= "\nUsage:\n";
	sUage+= "\t"+sCNB+"vvf "+sCN+"[options] /path/to/media/directory\n";
	sUage+= "\nOptions:\n"+sArgs;
	var sExts = ".3gp .3gp2 .264 .amv .asf .avi .bik .dv .divx .f4v .flv .gvi .m2t .m2ts .m2v";
	sExts+="\n\t.m4v .mkv .mov .mp2 .mp2v .mp4 .mp4v .mpeg .mpeg2 .mpeg4 .mpg .mxg .mtv nsv .nuv";
	sExts+="\n\t.rec .rm .rmvb .rpl .ogg .ogm .ogv .ogx .ps .qt .swf .vob .webm .wmv .xvid .wtv";
	sUage+= "\n"+sCNB+"Extensions:  "+sCN+sExts+"\n";
	var sDisplay = sUage + (UID !== msgExtra ? "\n\n"+msgExtra : "");

	log(sDisplay);
	if (UID !== iExitCode) { process.exit(iExitCode); }
}

/* where -h or --help or /? is present */
if (2 === process.argv.length){ showHelp(UID, 0); }
if (args.length < process.argv.length){ log("Invalid / too many arguments.", 1); }

var sPathFilesAll = UID; var sPathFilesDel = UID;
var sExts = UID;
var sPathScan = ".";
/* Minus X seconds from end of file. */
var iZSecondsDelay = 1;

for (iX=2; iX < process.argv.length; ++iX)
{
	for (var iY=0; iY < args.length; ++iY)
	{
		var sArgument = process.argv[iX];
		/* check for equal (=) type arguments */
		if (-1 !== sArgument.indexOf("="))
		{
			sArgument = process.argv[iX].split("=")[0]+"=";
			if (sArgument === "-oa=" || sArgument === "--outputall=" || sArgument === "/oa=")
			{
				sPathFilesAll = process.argv[iX].split("=")[1];
				if (UID === sPathFilesAll)
				{ log(sCR+"Invalid: '"+sCNB+sArgument+sCN+" <- is empty! but valid file expected eg: -oa=myall.json\n", 11); }
				break;
			}
			else if (sArgument === "-od=" || sArgument === "--outputdel=" || sArgument === "/od=")
			{
				sPathFilesDel = process.argv[iX].split("=")[1];
				if (UID === sPathFilesDel)
				{ log(sCR+"Invalid: '"+sCNB+sArgument+sCN+" <- is empty! but valid file expected eg: -od=mydel.json\n", 12); }
				break;
			}
			else if (sArgument === "-x=" || sArgument === "--xtensions=" || sArgument === "/x=")
			{
				sExts = process.argv[iX].split("=")[1];
				if (UID === sExts)
				{ log(sCR+"Invalid: '"+sCNB+sArgument+sCN+" <- is empty! list of extensions required eg: -x=dat,psv\n", 13); }
				else
				{
					if (sExts.split(",").length > 1) { args[13].push(sExts.split(",")); break; }
					else { args[13].push([sExts]); break; }
				}
			}
			else if (sArgument === "-zs=" || sArgument === "--zseconds=" || sArgument === "/zs=")
			{
				sExts = process.argv[iX].split("=")[1];
				if (UID === sExts)
				{ log(sCR+"Invalid: '"+sCNB+sArgument+sCN+" <- is empty! Require integer value in seconds eg: -zs=13\n", 13); }
				else
				{
					if (!is_int(sExts)) { log(sCR+"Invalid: '"+sCNB+sArgument+sCN+"<- expect numeric integer value!\n", 14); }
					else { iZSecondsDelay = sExts; break; }
				}
			}
			else { log(sArgument+"<- equative argument not supported!\n", 14); }
		}

		if (-1 !== args[iY][0].indexOf(sArgument)) { if (UID === args[iY][2]) { args[iY].push(true); } ++iArgsIn; break }
		else
		{  // we should check if its path if not then gibberish so exit
			if (!getFileRealPath(process.argv[iX]))
			{
				if (iY === args.length-1)
				{
					var sMsg = sCR+"Invalid: '"+sCNB+ process.argv[iX]+sCN+"'. Not an expected argument or PATH?\n";
					log(sMsg, 1);
				}
			}
			else
			{
				++iArgsIn;
				sPathScan = process.argv[iX];
				break;
			}
		}
	}
}

/* where -h or --help or /? is present */
if (UID !== args[0][2]) { showHelp(UID, 0); }

/* where -v or --version or /v */
if (UID !== args[11][2]) { log(sVERSION); process.exit(0); }
/* no matched arguments */
if (0===iArgsIn) { showHelp("\nInvalid: "+process.argv.toString()+" ...", 2); }
var sMsgConfl = "\nConflicting :'";
var sMsgClash = "' contradict. Can not have both.\n";
/* CANT HAVE: iterative & recursive: -li & -lr */
if (UID !== args[2][2] && UID !== args[3][2]) { showHelp(sMsgConfl+args[2][0]+"' & '"+args[3][0]+sMsgClash, 3); }
/* CANT HAVE: no-files & outputs: -nf & -oa || -od */
if (UID !== args[4][2] && (UID !== args[5][2] || UID !== args[6][2]))
{ showHelp(sMsgConfl+args[4][0]+"' & '"+args[5][0]+" "+args[6][0]+sMsgClash, 4); }
/* CANT HAVE: forked & unforked: -f & -u  */
if (UID !== args[1][2] && UID !== args[10][2]) { showHelp(sMsgConfl+args[1][0]+"' & '"+args[10][0]+sMsgClash, 5); }
/* CANT HAVE: single & watched: -s & -w  */
if (UID !== args[9][2] && UID !== args[10][2]) { showHelp(sMsgConfl+args[9][0]+"' & '"+args[10][0]+sMsgClash, 6); }
/* Construct API like object for request */
var oPS = {"cmd": "start", "path" : sPathScan, "delay" : iZSecondsDelay };
if (UID !== sPathFilesAll) { oPS.oa = sPathFilesAll; }
if (UID !== sPathFilesDel) { oPS.od = sPathFilesDel; }
/* no-files to output */
if (UID !== args[4][2]) { oPS.nf = true; }
/* watch forever -w (optional) where we dont have -s or no flags by default */
if (UID !== args[12][2]) { oPS.w = true; }
/* outsdtio / to screen -os (optional) */
if (UID !== args[7][2]) { oPS.os = true; }
/* recursive -lf (optional) */
if (UID !== args[3][2]) { oPS.lr = true; }
/* quiet -q (optional) */
if (UID !== args[8][2]) { oPS.q = true; }
/* Exensions -x (optional) */
if (UID !== args[13][2]) { oPS.x = args[13][2]; }
//----------------------------------------------------------------
/* Module Load: Forking OR conventionally in sync */
//----------------------------------------------------------------
if (UID !== args[1][2])
{
	log(sUage);
	try{ mVIPIFS = require("child_process").fork(__dirname+"./vvf_fs.js"); }
	catch(e){ log("Issue forking vvf_fs.js\n"+e); process.exit(1); }
	mVIPIFS.on("message", function(m)
	{
		if (UID !== m.msg && "OK" !== m.msg ) { log(m); }
		if (UID !== m.data && UID !== m.data.files)
		{
			if (UID === args[11][2]) { process.exit(0); }
		}
	});
	mVIPIFS.send(oPS);
}
else
{
	try
	{
		log(sUage);
		mVIPIFS = require("./vvf_fs.js");
		oPS.delay = iZSecondsDelay;
		mVIPIFS.initLoad(oPS);
		//process.exit(0);
	}
	catch(e){ log("Issue loading vvf_fs.js\n"+e); process.exit(1); }
}