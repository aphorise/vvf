#!/bin/bash
# #// cygwin debian & OSX shell sript (November 2015)
# #// Checkes for installation of ffmpeg tools & attempt to install
TSTART=$(date +%s) ; # #// START TIME
sOS=$(uname -a) ;
sFFMPG=$(ffmpeg -v 2>&1;) ;
# #//---------------------------------------------------------------
# #// MAIN / INIT:
# #//---------------------------------------------------------------
if [[ $sFFMPG == *'command not found'* ]] ; then
# # // no ffmpeg install do Deep OS checks.
	echo -e '\nYou do not appear to have ffmpeg installed.\n' ;
	case $sOS in
	*'Darwin'*)
		bcheck=$(brew -v 2>&1) ;
		if [[ $bcheck == *'command not found'* ]] ; then
			echo -n '`brew` package-manager missing. Install? (Y/n) :' && read YESNO ;
			if ! ( echo $YESNO | grep -iq "Y\|Ye|\Yes" ) || [ "$YESNO" == "" ] ; then
				echo -e 'ISSUE: brew package manager needed to continue.\n' ;
				exit 1 ;
			else
				ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)" ;
			fi ;
		fi ;
		echo -e '\nAttempting to install ffmpeg for OSX via homebrew.\n' ;
		if brew update -v && brew install ffmpeg ; then
			echo -e '\nSUCCESS.\nInstalled ffmpeg using brew.\nLinking vvf manually.\n' ;
			sudo cp vvf_index.js /bin/vvf && sudo cp vvf.js /bin/. && sudo chmod -x /bin/vvf.js && cp vvf.1.gz /usr/share/man/man1/. ;
		else
			echo -e ':-( \nERROR - could not install issue with brew / permisions?' ; exit 1 ;
		fi ;
	;;
	*'CYGWIN_NT'*)
		bcheck=$(apt-cyg -v 2>&1) ;
		if [[ $bcheck == *'command not found'* ]] || [[ $bcheck == *'No such file or directory'* ]] ; then
			echo -n '`apt-cyg` package-manager missing. Install? (Y/n) :' && read YESNO ;
			if ! ( echo $YESNO | grep -iq "Y\|Ye|\Yes" ) || [ "$YESNO" == "" ] ; then
				echo -e 'ISSUE: apt-cyg package manager needed to continue.\n' ;
				exit 1 ;
			else
				if git clone https://github.com/transcode-open/apt-cyg.git && \
					cd apt-cyg && cp -nf $(pwd)/apt-cyg /bin/. && cp -nf $(pwd)/apt-cyg /bin/apt-get && \
					cp -nf $(pwd)/apt-msys2 /bin/. && cd .. && rm -rf apt-cyg ; then :;
				else echo -e ':-( \nERROR - could not install or link apt-cyg?' ; exit 1 ; fi ;
			fi ;
		fi;
		if apt-cyg install pax binutils yasm unzip wget gcc-core ; then 
##			if git clone git://source.ffmpeg.org/ffmpeg.git && cd ffmpeg && 
			if wget https://github.com/FFmpeg/FFmpeg/archive/master.zip -O ffmpeg.zip && unzip ffmpeg.zip && cd FFmpeg-master && \
				./configure --target-os=cygwin --arch=x86_64 --disable-schannel && \
				make -j $(nproc) && make install && cd .. && rm -rf FFmpeg-master && rm ffmpeg.zip ; then
					echo -e 'Success! :-D - installed ffmpeg.\nLinking vvf manually.\n' ; sudo cp vvf_index.js /bin/vvf && sudo cp vvf.js /bin/. && sudo chmod -x /bin/vvf.js && cp vvf.1.gz /usr/share/man/man1/. ;
			else echo ':-( ISSUE: building ffpmg' ; exit 1; fi ;
		else echo ':-( ISSUE: dependecies to make ffpmg' ; exit 1; fi ;
	;;
	*'Debian'*)
		if (($UID==0)) ; then apt-get -y -q install ffmpeg ;
		else
			echo -e '\nLacking root / *su* permissions.\nIf any issues / failures, Try re-runing with: `sudo ....`\n\n' ;
			if ! sudo apt-get install -y -q -f -y -q ffmpeg ; then exit 1 ;
			else
				sFFMPG=$(ffmpeg -v 2>&1;) ;
				if [[ $sFFMPG == *'command not found'* ]] ; then
					echo -e '\nIssue failed! :-(\nRetry installing manually using script or otherwise.' ;
				else
					echo -e '\nSuccess! :-D - installed ffmpeg.\nLinking vvf manually.\n' ;
					sudo cp vvf_index.js /bin/vvf && sudo cp vvf.js /bin/. && sudo chmod -x /bin/vvf.js && cp vvf.1.gz /usr/share/man/man1/.;
				fi ;
			fi ;
		fi ;
	;;
	*) echo -e 'Mac OSX Targetted Script\n'$sOS' Not supported Sorry.\nTake actions yourself.\n' ;
		echo -e 'refer to: https://github.com/FFmpeg/FFmpeg/archive/master.zip for building or: git://source.ffmpeg.org/ffmpeg.git' ;
		exit 0 ;
	;;
	esac ;
else echo -e '\nAlready have ffmpeg installed exiting.\n' ; fi ;

TEND=$(date +%s) ; TDIFF=$(( $TEND - $TSTART )) ;
aMsg='\nCompleted '$0' in: '$TDIFF' seconds.\n' ;
echo -e $aMsg ;
exit 0 ;

