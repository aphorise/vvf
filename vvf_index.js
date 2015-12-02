#!/usr/bin/env node
var sMsgErrReq="ERROR "+"loading required: modules.\nDid you -> npm install <- ?\n";
var UID; /*shorthand undefined*/
var bTTY = Boolean(process.stdout.isTTY) || (UID !== process.env.TERM && "xterm-256color" === process.env.TERM) 
; // execution in terminal?
function sRaw(msg) { return bTTY ? msg : msg.replace( /\033\[[0-9;]*m/g, "" ); } /* strip TTY ANSI colours for 
no TTY */
var sCR=""+sRaw("\033[31m"),/*Red*/ sCC=""+sRaw("\033[36m");/*Cyan*/
var sCDG=""+sRaw("\033[90m"),/*Dark Gray*/ sCG=""+sRaw("\033[32m");/*Green*/
var sCN=""+sRaw("\033[0m"),/*Natural*/ sCNB=""+sRaw("\033[1m");/*Natural Bold*/
var sCP=""+sRaw("\033[35m"),/*Purple*/ sCY=""+sRaw("\033[33m");/*Yellow*/
var sCRBG=""+sRaw("\033[41");/*Red BG + White Text*/
var sMsgErrReq="ERROR "+"loading required: modules.\nDid you -> npm install <- ?\n";
function log(msg) { process.stdout.write(msg); }
//----------------------------------------------------------------
/* Packages Required: */
//----------------------------------------------------------------
/* OUGHT TO BE VALID AT THIS POINT */
var mWMFS, mFS;
try{ mFS = require("fs"); }
catch(e){ log(sMsgErrReq+ "\n"+e); process.exit(1); }

function getFileRealPath(s){ try {return mFS.realpathSync(s);} catch(e){return false;} }
var iArgsIn = 0;
var sArgs = "";
var args =
[
	[["-h", "--help", "/?" ], "\t Shows this screen."],
	[["-f", "--forever", "/f" ], "Run / watch file-system indefinitely."],
	[["-li", "--iterative", "/li" ], "(default) Iterate over file-system using 'find'."],
	[["-oa=", "--outall=", "/oa=" ], "Output for all media files definitions (default: wmfs.json)."],
	[["-od=", "--outdel=", "/od=" ], "Deleted media files to be appended to (default: wmfs_del.json)."],
	[["-lr", "--recursive", "/lr" ], "Recursively list file-system (regex match all files)."],
	[["-s", "--single", "/s" ], "(default) Single execution / runs only once."],
]
for (var iX=0; iX < args.length; ++iX){ sArgs+="\t"+args[iX][0].join(", ")+"\t "+args[iX][1]+"\n"; }
var sUage= "\n";
sUage+= sCDG+"|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|\n"+sCN;
sUage+= sCDG+"|"+sCR+"    Valid"+sCG+" Video"+sCC+" Files "+sCDG+"     |\n";
sUage+= sCDG+"|___________________________|\n"+sCN;
sUage+= sCN+"        "+sCNB+"vvf"+sCN+" - "+sCDG+"v0.0.1\n"+sCN;

function showHelp(msgExtra, iExitCode)
{
	sUage+= "\nUsage:\n";
	sUage+= "\tvvf [options] /path/to/media/directory \n";
	sUage+= "\nOptions:\n"+sArgs;
	sUage+= "\nExpected File Extensions:\t .avi, .m4v, .mkv, .mov, .mp4, .mpg, .mpeg, .qt";
	console.log(sUage,(UID !== msgExtra)?msgExtra:"");
	process.exit(iExitCode);
}

if ( 2 === process.argv.length){ showHelp(); }
else
{
	if (args.length < process.argv.length){ showHelp("Too many arguments."); process.exit(1); }

	var sPathFilesAll = UID; 
	var sPathFilesDel = UID; 
	var sPathScan = ".";

	for (var iX=0; iX < process.argv.length; ++iX)
	{
		for (var iY=0; iY < args.length; ++iY)
		{
			var sArgument = process.argv[iX];
			/* check for equal (=) type arguments */
			if (-1 !== sArgument.indexOf("="))
			{
				sArgument = process.argv[iX].split("=")[0]+"=";
				if (sArgument === "-oa=" || sArgument === "-outputall=" || sArgument === "/oa=")
				{
					sPathFilesAll = process.argv[iX].split("=")[1];
				}
				if (sArgument === "-od=" || sArgument === "-outputdel=" || sArgument === "/od=")
				{
					sPathFilesDel = process.argv[iX].split("=")[1];
				}
			}

			if (-1 !== args[iY][0].indexOf(sArgument)) { args[iY].push(true); ++iArgsIn; break }
			else
			{	// we should check if its path if not then gibberish so exit
				if (!getFileRealPath(process.argv[iX]))
				{
					if (iY === args.length-1)
					{
						showHelp("\nDo not understand '"+process.argv[iX]+"'. Not an expected argument or PATH?\n", 1);
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

	if (UID !== args[0][2]) { showHelp(UID, 0);}
	else
	{
		if (0===iArgsIn) { showHelp("\nDo not understand all of: "+process.argv.toString()+" ...", 2); }
		if (UID !== args[2][2] && UID !== args[5][2])
		{
			showHelp("\nConflicting '"+args[2][0]+"' & '"+args[5][0]+"' contradicting. Can not have both.\n", 3);
		}
		if (UID !== args[1][2] && UID !== args[6][2])
		{
			showHelp("\nConflicting '"+args[1][0]+"' & '"+args[6][0]+"' contradicting. Can not have both.\n", 4);
		}

		//----------------------------------------------------------------
		/* Packages Required: */
		//----------------------------------------------------------------
		/* OUGHT TO BE VALID AT THIS POINT */
		try{ mWMFS = require("child_process").fork(__dirname+"/vvf.js"); }
		catch(e){ console.log(sMsgErrReq+ "\n"+e); process.exit(1); }

		var oPS = {"cmd": "start", "path" : sPathScan };
		if (UID !== sPathFilesAll) { oPS.oa = sPathFilesAll; }
		if (UID !== sPathFilesAll) { oPS.od = sPathFilesDel; }

		/* single run '-s' or default where we dont have -f flag */
		if (UID !== args[6][2] || (UID === args[1][2] && UID === args[1][2])) { oPS.s = true; }

		/* forever run '-f' (optional) where we dont have -s flag */
		if (UID !== args[1][2]) { oPS.f = true; }

		mWMFS.on("message", function(m)
		{
			if (UID !== m.msg && "OK" !== m.msg ) { console.log("*PAREANT-PS received:", m); }
			if (UID !== m.data.files){ process.exit(0); }
		});

		mWMFS.send(oPS);
	}
}
