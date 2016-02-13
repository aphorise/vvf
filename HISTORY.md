### `0.0.3` / 2016-01-09

  * added -zs option for custom seconds from end.
  * additional audio, video info including codecs, resolution, etc.
  * documentation clarity.


------------------------------------------
### `0.0.2` / 2015-12-07

  * droped `date` depency which caused issues in OSX.
  * increase accuracy of duration reporting with new none-date approach.
  * `-q`, `-nf`, `-v`, `-x`, arguments / flags introduced for better cli use.
  * increased extensions supproted by defualt for scanning.
  * install script patched with appropriate `sudo` where required.


------------------------------------------
### `0.0.1` / 2015-11-22

  * working prototype with `install_ffmpeg.bash` script & npm linking.



------------------------------------------
### `0.0.0` / 2015-11-21

prototype never commited of bash only with: `ffprobe` && `ffmpeg`

```
 a=$(ffmpeg.exe -v debug -threads 8 -nostats -i BAD_FILE.mp4 -f null 2>&1) ;
 echo -e $a | grep -o --color -E 'Duration: ([0-9]{2}:){2}[0-9]{2}\.[0-9]{2}|error|invalid' ;
```
