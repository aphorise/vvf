#!/usr/local/bin/node
var sVERSION = "v0.0.2";
var UID; /**shorthand undefined*/
//----------------------------------------------------------------
/* Packages Required: */
//----------------------------------------------------------------
var mWMFS, mFS;
try{ mFS = require("fs"); }
catch(e){ console.log("\nDid you -> npm install <- ?\n\n"+e); process.exit(1); }
/*----------------------------------------------------------------*/
var bTTY = Boolean(process.stdout.isTTY) || (UID !== process.env.TERM && "xterm-256color" === process.env.TERM);
function sRaw(msg) { return bTTY ? msg : msg.replace( /\033\[[0-9;]*m/g, "" ); } /* strip TTY ANSI colours for no TTY */
var sCR=""+sRaw("\033[31m"),/*Red*/ sCC=""+sRaw("\033[36m");/*Cyan*/
var sCDG=""+sRaw("\033[90m"),/*Dark Gray*/ sCG=""+sRaw("\033[32m");/*Green*/
var sCN=""+sRaw("\033[0m"),/*Natural*/ sCNB=""+sRaw("\033[1m");/*Bold Text*/
var sCP=""+sRaw("\033[35m"),/*Purple*/ sCY=""+sRaw("\033[33m");/*Yellow*/
var sCRBG=""+sRaw("\033[41");/*Red BG+White Text*/
var sUage= "\n";
sUage+= sCDG+"|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|\n"+sCN;
sUage+= sCDG+"|"+sCR+"    Valid"+sCG+" Video"+sCC+" Files "+sCDG+"     |\n";
sUage+= sCDG+"|___________________________|\n"+sCN;
sUage+= sCN+"	"+sCNB+"vvf"+sCN+" - "+sCDG+sVERSION+"\n"+sCN;
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
/*8*/[["-q", "--quiet", "/q" ], "Quiet mode no error or default header output useful with -os."],
/*9*/[["-s", "--single", "/s" ], "(default) Single scan execution checking fs-tree once."],
/*10*/[["-u", "--unforked", "/u" ], "(default) Single none-forked or threaded sync process."],
/*11*/[["-v", "--version", "/v" ], "Output version information & exit."],
/*12*/[["-w", "--watch", "/w" ], "\t Watch file-system scanning indefinitely (forever)."],
/*13*/[["-x=", "--xtensions=", "/x=" ], "Insensitive comma separated list of file extensions (-x=av,dat)"]
];

function log(msg) {process.stdout.write(msg); /*console.log(msg);*/ }

function getFileRealPath(s){ try {return mFS.realpathSync(s);} catch(e){return false;} }

var iArgsIn = 0;
var sArgs = "";
for (var iX=0; iX < args.length; ++iX){ sArgs+="\t"+args[iX][0].join(", ")+"\t "+args[iX][1]+"\n"; }

function showHelp(msgExtra, iExitCode)
{
	sUage+= "\nUsage:\n";
	sUage+= "\tvvf [options] /path/to/media/directory \n";
	sUage+= "\nOptions:\n"+sArgs;
	var sExts = ".3gp .3gp2 .264 .amv .asf .avi .bik .dv .divx .f4v .flv .gvi .m2t .m2ts .m2v";
	sExts+="\n\t.m4v .mkv .mov .mp2 .mp2v .mp4 .mp4v .mpeg .mpeg2 .mpeg4 .mpg .mxg .mtv nsv .nuv";
	sExts+="\n\t.rec .rm .rmvb .rpl .ogg .ogm .ogv .ogx .ps .qt .swf .vob .webm .wmv .xvid .wtv";
	sUage+= "\nExtensions:  "+sExts;
	console.log(sUage,(UID !== msgExtra)?msgExtra:"");
	process.exit(iExitCode);
}

if (2 === process.argv.length){ showHelp(); }
else
{
	if (args.length < process.argv.length){ showHelp("Too many arguments."); process.exit(1); }
	var sPathFilesAll = UID; var sPathFilesDel = UID;
	var sExts = UID;
	var sPathScan = ".";
	for (var iX=2; iX < process.argv.length; ++iX)
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
					if (UID === sPathFilesAll)
					{ showHelp(sArgument+" <- is empty! but valid file expected eg: -oa=myall.json\n", 11); }
				}
				else if (sArgument === "-od=" || sArgument === "-outputdel=" || sArgument === "/od=")
				{
					sPathFilesDel = process.argv[iX].split("=")[1];
					if (UID === sPathFilesDel)
					{ showHelp(sArgument+" <- is empty! but valid file expected eg: -od=mydel.json\n", 12); }
				}
				else if (sArgument === "-x=" || sArgument === "-xtensions=" || sArgument === "/x=")
				{
					sExts = process.argv[iX].split("=")[1];
					if (UID === sExts)
					{ showHelp(sArgument+" <- is empty! list of extensions required eg: -x='dat,psv\n", 13); }
					else
					{
						if (sExts.split(",").length > 1) { sExts = sExts.split(","); }
						else { var aExt = []; aExt.push(sExts); sExts = aExt; }
					}
				}
				else { showHelp(sArgument+"<- equative argument not supported!\n", 14); }
			}

			if (-1 !== args[iY][0].indexOf(sArgument)) { args[iY].push(true); ++iArgsIn; break }
			else
			{	// we should check if its path if not then gibberish so exit
				if (!getFileRealPath(process.argv[iX]))
				{
					if (iY === args.length-1)
					{
						showHelp("\n\nDo not understand '"+sCR+sCNB+ process.argv[iX]+sCN+"'. Not an expected argument or PATH?\n", 1);
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

	if (UID !== args[0][2]) { showHelp(UID, 0); }
	else
	{	/* where -v is present */
		if (UID !== args[11][2]) { log(sVERSION); process.exit(0); }
		/* no matched arguments */
		if (0===iArgsIn) { showHelp("\nDo not understand all of: "+process.argv.toString()+" ...", 2); }
		var sMsgConfl = "\nConflicting :'";
		var sMsgClash = "' contradict. Can not have both.\n";
		/* CANT HAVE: iterative & recursive: -li & -lr */
		if (UID !== args[2][2] && UID !== args[3][2])
		{ showHelp(sMsgConfl+args[2][0]+"' & '"+args[3][0]+sMsgClash, 3); }
		/* CANT HAVE: no-files & outputs: -nf & -oa || -od */
		if (UID !== args[4][2] && (UID !== args[5][2] || UID !== args[6][2] ))
		{ showHelp(sMsgConfl+args[4][0]+"' & '"+args[5][0]+" "+args[6][0]+sMsgClash, 4); }
		/* CANT HAVE: forked & unforked: -f & -u  */
		if (UID !== args[1][2] && UID !== args[10][2])
		{ showHelp(sMsgConfl+args[1][0]+"' & '"+args[10][0]+sMsgClash, 5); }
		/* CANT HAVE: single & watched: -s & -w  */
		if (UID !== args[9][2] && UID !== args[10][2])
		{ showHelp(sMsgConfl+args[9][0]+"' & '"+args[10][0]+sMsgClash, 6); }
		/* Construct API like object for request */
		var oPS = {"cmd": "start", "path" : sPathScan };
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
		if (UID !== sExts) { oPS.x = sExts }
		//----------------------------------------------------------------
		/* Module Load: Forking OR conventionally though in sync */
		//----------------------------------------------------------------
		if (UID !== args[1][2])
		{
			try{ mWMFS = require("child_process").fork(__dirname+"/vvf.js"); }
			catch(e){ log("Issue forking vvf.js\n"+e); process.exit(1); }
			mWMFS.on("message", function(m)
			{
				if (UID !== m.msg && "OK" !== m.msg ) { log(m); }
				if (UID !== m.data && UID !== m.data.files)
				{
					if (UID === args[11][2]) { process.exit(0); }
				}
			});
			mWMFS.send(oPS);
		}
		else
		{
			try{ mWMFS = require(__dirname+"/vvf.js"); }
			catch(e){ log("Issue loading vvf.js\n"+e); process.exit(1); }
			mWMFS.initLoad(oPS);
			process.exit(0);
		}
	}
}

