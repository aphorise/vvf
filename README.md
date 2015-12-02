# `V`alid `V`ideo `F`iles (`vvf`)

`vvf` is a *_syncronious_* [**`Node.js`**] script that uses [**`ffmpeg`**] to detect valid video files at a given path. A frame is decoded from the end / a second less than the claimed duration and all files that pass this process are considered a valid video ready for processing (eg: 3rd party online encoders). This is particularly useful over typical [_`fs.watch`_] approach especially in cases where video content may be in a state of transfer / copy (eg across network) and not considerable as a file in a complete or ready state.

Expected file extensions that monitored include:



| files: | `.avi`, `.m4v`, `.mkv`, `.mov`, `.mp4`, `.mpg`, `.mpeg`, `.qt` |
| --- | --- |
| `Know` `No`'s : | symlinked paths / directories are not followed & do not work. |


## Installation
```
npm install vvf    # local repo install to use in your project
npm install -g vvf # global install
```


## Usage
Once installed `vvf` can be used as standalone command to execute or further extended as module in your `Node.js` script / project. 

### `shell` / Command Line Interface (CLI)
Once installed you may run in *_`shell`_* 
```
vvf . # which will watch current path 
vvf . -f # same as above watching indefinite 
```

### `npm`
Using `vvf` as an `npm` module is also possible by way of:
 - [_`Fork Process`_] (__advised__)
 - Require module (*__not recommended__*)

Using the module in the common manner of `var ffs = require("ffs");` is *__not advised__* unless a synchronous flow is compatible with your process.

Whats expected with each invocation / call is a request object such as:
```
var oPS = {"cmd": "start", "path": "/path/to/directory", "s": true, "oa": "all.json", "od": "del.json" };
// substitute "s" for single execution with "f" for indefinite forever watch. 
```

#### `module` fork process
The exemplified mock below assumes that `vvf` is also installed locally using `npm install vff` instead of the global version.
```
var mVFF;
try{ mVFF = require("child_process").fork(__dirname+"/node_modules/vff/vff.js"); }
catch(e){ console.log("Could NOT fork required module.\n"+e); process.exit(1); }
/* alternative you may refer to the globally installed version replacing __dirname */

var oPS = {"cmd": "start", "path" : "/path/to/directory", "s" : true };
/* do a single scan on requested path */

mVFF.on("message", function(m)
{
	if (UID !== m.msg && "OK" === m.msg ) { console.log("vvf is started with:", m); return; }
	if (UID !== m.msg) { console.log("vvf sent:", m); return; }
});
```
The forked process emits notifications by way of `process.send` that parent process can listen to as demonstrated above. For a complete example refer to `vvf_index.js` that uses `vvf.js` in this forked manner. 

#### `module` require
Similarly `vvf` can be loaded as a require.
```
var mVFF;
try{ mVFF = require("vff"); }
catch(e){ console.log("npm module missing?\nCould NOT load required module.\n"+e); process.exit(1); }
var oPS = {"cmd": "start", "path" : "/path/to/directory", "s" : true };
/* do a single scan on requested path */
var sRet = mVFF.initLoad(oPS);
console.log("Completed vff call - recieved:\n----\n" + sRet+"\n----\n");
```
This synchronously calls `vff` module and thereafter where the process is complete it returns a json of all files while still outputting `vff.json` & `vff_del.json` at the current / specified path.

----

### Notes
There are faster approximation techniques that may be used in favour of the decode approach which can attain four times (`4x`) faster or greater improvements to overall required times.

For example one can obtain the acclaimed `bit` / `mbps` rate and multiply this by the total `duration` to obtain the minimum expected file size that could then be observed; the draw backs with this approach are that they would not work with `zero` padded files that maybe streamed into nor where `bit` rates may be wrong / erroneous.

The current techniques used by `vvf` is also not prone to false-passes in certain cases such as those where the content is in hash-transfer (eg: `torrents`) and contains the ending segment of content but not all prior or other parts.

What may serve is a combination scheme of approximation with sampled frame encoding of quartiles segment ranges (upper, lower, etc) thereby reducing the probability of any files being incorrectly considered as ready.

### Version
0.0.1


License
----
GPLv3

  [**`Node.js`**]: <https://nodejs.org/en/>
  [**`ffmpeg`**]: <https://ffmpeg.org/>
  [_`fs.watch`_]: <https://nodejs.org/api/all.html#all_fs_watch_filename_options_listener>
  [_`Fork Process`_]: <https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options>  
