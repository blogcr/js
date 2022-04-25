(function(){ // isolation

var mytuner_scripts = window.mytuner_scripts || {};
mytuner_scripts["widget-player-v1.js"] = true;

window.players = window.players || {};

window.addPlayerInstance = function(id, at, callback=function(){}) {
    let player = new PlayerInstance(id, at);
    player.initialize(callback);
    players[id] = player;
}

var globalSM = {
    _crypto_js_loaded: false,
    _sm2_js_loaded: false,
    _hls_js_loaded: false,
    _sm2_initialized: false
}

var globalSM_queue = {}
var loaded_scripts = {}
var playing_player = null;

function PlayerInstance(id, at) {

    let widget_id = id;
    let access_token = at;
    let stream_name = widget_id + "radio_stream";
    let sound = null;
    let volume_indicator = document.getElementById(widget_id + "volume-indicator");
    let volume_controller = document.getElementById(widget_id + "volume-control");
    let _pi = this;

    // add listeners
    volume_indicator.onclick = function() {
        mtPlayer.toggleMute();
    }
    volume_controller.oninput = function() {
        mtPlayer.setVolume(this.value);
    }

    //initialize();
    function genk(str) {
        var hex = '';
        var i,j;
        j=0;
        for(i=0; i<32; i++) {
            hex += ''+str.charCodeAt(j).toString(16);
            j++;
            if(j>=str.length) {
                j = 0;
            }
        }
        return hex;
    }
    function remove_null_prefix(s) {
        if(s.length>6) {
            return s.substring(6,s.length);
        }
        return s;
    }
    function d(iv_,ciphertext_) {
        var iv = CryptoJS.enc.Hex.parse(remove_null_prefix(iv_)),
        cipher = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(remove_null_prefix(ciphertext_))
        }),
        result = CryptoJS.AES.decrypt(cipher, CryptoJS.enc.Hex.parse(genk(t.toString())), {iv: iv, mode: CryptoJS.mode.CFB});
        return result.toString(CryptoJS.enc.Utf8);
    }
    this.initialize = function(callback = function(){}) {
        if(!globalSM._crypto_js_loaded){
            var script_name = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js";
            globalSM_queue[script_name] = globalSM_queue[script_name] || [];
            globalSM_queue[script_name].push(then);
            loadScript(script_name);
        } else {
            then();
        }
        function then(){
            globalSM._crypto_js_loaded = true;
            var radio_id = document.getElementById(widget_id).dataset.target;
            ajax.call(this, {
                type: 'POST',
                url: 'https://ajax.mytuner-radio.com/ajax/get-station-streams/',
                dataType : 'json',
                data: {'access_token': access_token, 'radio_id': radio_id},
                success: function(data) {
                    t = data.t;
                    playlist = formatPlaylist(JSON.parse(data.p));
                    mtPlayer._initialized = true;
                    callback();
                }
            });
        }
    }


    var only_mms = true;

    function formatPlaylist(playlist) {
        var formated_playlist = [];
        for (i = 0; i < playlist.length; i++) {
            if(playlist[i]["type"].localeCompare("mms") != 0) {
                var stream_iv = "/null/" + playlist[i]["iv"];
                var cipher = "/null/" + playlist[i]["cipher"];
                formated_playlist.push({file:d(stream_iv,cipher) , type:playlist[i]["type"]});
                only_mms = false;
            }
        }

        return formated_playlist;
    }

    var next_index = 0; // playlist index
    var playStartDate = 0;
    var errorTimeoutDate = 0;
    var lastMediaError = 0;
    var playlist = [];

    var volume_up = '<path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 4.45v.2c0 .38.25.71.6.85C17.18 6.53 19 9.06 19 12s-1.82 5.47-4.4 6.5c-.36.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85C18.6 19.11 21 15.84 21 12s-2.4-7.11-5.79-8.4c-.58-.23-1.21.22-1.21.85z"/>'
    var volume_down = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L9 9H6c-.55 0-1 .45-1 1z"/>'
    var volume_off = '<path d="M3.63 3.63c-.39.39-.39 1.02 0 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>'
    var volume_mute = '<path d="M7 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L11 9H8c-.55 0-1 .45-1 1z"/>'

    function loadScript(url){
        // skip if already loaded
        if (loaded_scripts[url]) {
            return;
        }
        loaded_scripts[url] = true;

        var script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState){  //IE
            script.onreadystatechange = function(){
                if (script.readyState == "loaded" || script.readyState == "complete"){
                    script.onreadystatechange = null;
                    runQueue();
                }
            };
        } else {  //Others
            script.onload = function(){
                runQueue();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);

        function runQueue() {
            globalSM_queue[url].forEach(function(func) {
                func();
            });
        }
    }

    var mtPlayer = {
        _initialized: false,
        _isPlaying: false,
        _player: "",
        _sm2_initialized: false,
        _hls_js_initialized: false,
        _hls_js_loaded: false,
        _sm2_js_loaded: false,
        _hls_js_video_element: [],
        _isSuspended: false,
        _confirmedPlay: false,
        _isMuted: false,
        _volume: loadVolume(),
        isPlaying: function() {
            return mtPlayer._isPlaying;
        },
        isSuspended: function() {
            return mtPlayer._isSuspended;
        },
        confirmedPlay: function() {
            return mtPlayer._confirmedPlay;
        },
        choosePlayer: function(stream_url) {
            if(stream_url.indexOf(".m3u8") !== -1) {
                var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
                   navigator.userAgent &&
                   navigator.userAgent.indexOf('CriOS') == -1 &&
                   navigator.userAgent.indexOf('FxiOS') == -1;
                if(!isSafari) {
                    return "hls.js";
                }
            }

            return "sm2";
        },
        initializeHlsJS: function() {
            if(!mtPlayer._hls_js_initialized) {
                var audio = document.createElement("audio");
                audio.id = widget_id + "mtPlayer-video-element";
                audio.style.display = "none";
                document.body.appendChild(audio);
                mtPlayer._hls_js_video_element = audio;
                mtPlayer._hls_js_initialized = true;
            }
        },
        cleanupHlsJS: function() {
            mtPlayer.hls.destroy();
            var audio = document.getElementById(widget_id + "mtPlayer-video-element");
            audio.parentNode.removeChild(audio);
            mtPlayer._hls_js_video_element = [];
            mtPlayer._hls_js_initialized = false;
        },
        play: function(stream_url) {
            if (playing_player != null && playing_player != mtPlayer) {
                playing_player.stop();
                playing_player = null;
            }
            mtPlayer.destroyPlayers();

            mtPlayer._player = mtPlayer.choosePlayer(stream_url);
            var p_button = document.getElementById(widget_id + "play-button");
            p_button.classList.add("loading");
            p_button.classList.remove("error");
            p_button.classList.remove("playing");

            mtPlayer._confirmedPlay = false;
            mtPlayer._isSuspended = false;

            errorTimeoutDate = 0;
            lastMediaError = 0;

            function play_sm2() {
                //mtPlayer._sm2_js_loaded = true;
                globalSM._sm2_js_loaded = true;

                //if(!mtPlayer._sm2_initialized){
                if(!globalSM._sm2_initialized){
                    var script_name = "initializeSM";
                    globalSM_queue[script_name] = globalSM_queue[script_name] || [];
                    globalSM_queue[script_name].push(then);
                    initializeSM();
                } else {
                    then();
                }

                function then() {
                    if (sound === null) {
                        sound = soundManager.createSound({
                             id: stream_name,
                             url: stream_url,
                             onfinish: onfinish,
                             onerror: onerror,
                             whileloading: safarifix,
                             whileplaying: whileplaying,
                             onload: onload
                        });
                    }
                    //soundManager.play(stream_name);
                    sound.play();
                    playing_player = mtPlayer;
                    mtPlayer.setVolume(mtPlayer._volume);
                }
            }

            function play_hls() {
                //mtPlayer._hls_js_loaded = true;
                globalSM._hls_js_loaded = true;

                if(!Hls.isSupported()){
                    mtPlayer._player = "sm2";
                    play_sm2();
                } else {
                    mtPlayer.initializeHlsJS();
                    mtPlayer.hls = new Hls();
                    mtPlayer.hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                        mtPlayer.hls.loadSource(stream_url);
                        mtPlayer.hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                            var promise = mtPlayer._hls_js_video_element.play();
                            if (promise !== undefined) {
                                promise.then(function () {
                                    whileplaying();
                                }).catch(function (error) {
                                    mtPlayer.stop();
                                });
                            }
                        });
                    });
                    mtPlayer._hls_js_video_element.onended = onfinish;
                    mtPlayer.hls.on(Hls.Events.ERROR, hls_onerror);
                    mtPlayer.hls.attachMedia(mtPlayer._hls_js_video_element);
                    mtPlayer.setVolume(mtPlayer._volume);
                }
            }

            if(mtPlayer._player === "sm2") {
                //if(!mtPlayer._sm2_js_loaded){
                if(!globalSM._sm2_js_loaded){
                    var script_name = "https://cdnjs.cloudflare.com/ajax/libs/soundmanager2/2.97a.20170601/script/soundmanager2-nodebug-jsmin.js";
                    globalSM_queue[script_name] = globalSM_queue[script_name] || [];
                    globalSM_queue[script_name].push(play_sm2);
                    loadScript(script_name);
                } else {
                    play_sm2();
                }
            } else if(mtPlayer._player === "hls.js") {
                if(window.location.protocol === "https:" && !stream_url.startsWith("https")){
                    advance_to_next_stream();
                    return;
                }

                //if(!mtPlayer._hls_js_loaded){
                if(!globalSM._hls_js_loaded){
                    var script_name = "https://cdn.jsdelivr.net/npm/hls.js@latest";
                    globalSM_queue[script_name] = globalSM_queue[script_name] || [];
                    globalSM_queue[script_name].push(play_hls);
                    loadScript(script_name);
                } else {
                    play_hls();
                }
            }
            mtPlayer._isPlaying = true;
        },
        stop: function() {
            mtPlayer.destroyPlayers();
            mtPlayer._isPlaying = false;
            var p_button = document.getElementById(widget_id + "play-button");
            p_button.classList.remove("loading");
            p_button.classList.remove("error");
            p_button.classList.remove("playing");

            if(playStartDate !== 0) {
                var elapsedTime = new Date();
                elapsedTime = elapsedTime - playStartDate;
                playStartDate = 0;
            }
        },
        destroyPlayers: function() {
            if(mtPlayer._player === "hls.js") {
                if(mtPlayer._hls_js_initialized) {
                    mtPlayer.cleanupHlsJS();
                }
            } else if(mtPlayer._player === "sm2") {
                if (sound != null) {
                    // soundManager.stop(stream_name);
                    sound.stop();
                    // soundManager.destroySound(stream_name);
                    sound.destruct();
                    sound = null;
                }
            }

        },
        setVolume: function(volume) {
            if(soundIconRequiresChange(volume)) {
                if( volume < 2 )
                    volume_indicator.innerHTML = volume_mute;
                else if (volume < 33)
                    volume_indicator.innerHTML = volume_down;
                else
                    volume_indicator.innerHTML = volume_up;
            }

            //if(mtPlayer._isPlaying) {
            if(mtPlayer._player === "sm2") {
                if(sound != null) {
                    // volume and mute and common to all songs. enforce this song settings.
                    sound.unmute();
                    mtPlayer._isMuted = false;
                    sound.setVolume(volume);
                }
            } else if(mtPlayer._player === "hls.js") {
                if(mtPlayer._isMuted) {
                    mtPlayer._hls_js_video_element.muted = false;
                    mtPlayer._isMuted = false;
                }
                mtPlayer._hls_js_video_element.volume = volume / 100;
            }
            mtPlayer._volume = volume;
        },
        toggleMute: function() {
            //if(mtPlayer._isPlaying) {
            if(sound != null) {
                if(mtPlayer._player === "sm2") {
                    if(mtPlayer._isMuted) {
                        // soundManager.unmute(stream_name);
                        sound.unmute();
                        mtPlayer.setVolume(mtPlayer._volume);
                    }
                    else {
                        // soundManager.mute(stream_name);
                        sound.mute();
                        volume_indicator.innerHTML = volume_off;
                    }
                } else if(mtPlayer._player === "hls.js") {
                    if(mtPlayer._isMuted) {
                        mtPlayer._hls_js_video_element.muted = false;
                        mtPlayer.setVolume(mtPlayer._volume);
                    }
                    else {
                        mtPlayer._hls_js_video_element.muted = true;
                        volume_indicator.innerHTML = volume_off;
                    }
                }
                mtPlayer._isMuted = !mtPlayer._isMuted;
            }
        }
    };

    function advance_to_next_stream() {
        // when player was playing, the current stream works but an error occured. Retry all streams.
        if(mtPlayer.confirmedPlay()) {
            next_index = -1; // next code will increment to 0
        }
        mtPlayer._isPlaying = false;
        if(next_index < playlist.length) {
            var p_button = document.getElementById(widget_id + "play-button");
            p_button.classList.add("loading");
            p_button.classList.remove("error");
            p_button.classList.remove("playing");
            next_index += 1;
            _pi.update();
        } else {
            mtPlayer.stop();
            var p_button = document.getElementById(widget_id + "play-button");
            p_button.classList.add("error");
            p_button.classList.remove("loading");
            p_button.classList.remove("playing");
            next_index = 0;
        }
    }

    function onfinish() {
        //console.log("ONFINISH");
        advance_to_next_stream();
    }

    function whileplaying() {
        //console.log("SM2 WHILEPLAYING");
        if(this.bytesLoaded !== null && !mtPlayer.confirmedPlay()) {
            var p_button = document.getElementById(widget_id + "play-button");
            p_button.classList.add("playing");
            p_button.classList.remove("error");
            p_button.classList.remove("loading");
            if(playStartDate == 0) {
                playStartDate = new Date();
            }
            mtPlayer._isPlaying = true;
            mtPlayer._confirmedPlay = true;
        }
    }

    function safarifix(){
        //console.log("WHILELOADING: confirmedPlay: "+mtPlayer.confirmedPlay()+", readyState: "+this.readyState);
        if( !mtPlayer.confirmedPlay() && this.readyState === 3) {
            //mtPlayer.stop();
            //mtPlayer._isSuspended = true;
            mtPlayer._isPlaying = false;
            var p_button = document.getElementById(widget_id + "play-button");
            p_button.classList.remove("loading");
            p_button.classList.remove("error");
            p_button.classList.remove("playing");
        }
    }

    function onerror() {
        //console.log("ONERROR");
        advance_to_next_stream();
    }

    function hls_onerror(event, data) {
        // console.log("hls_onerror fatal? "+data.fatal+", type: "+data.type);
        if(errorTimeoutDate === 0) {
            errorTimeoutDate = new Date();
        } else if(new Date() - errorTimeoutDate > 5000) {
            advance_to_next_stream();
        }
        if (data.fatal) {
            switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    // try to recover network error
                    // console.log("fatal network error encountered, try to recover");
                    mtPlayer.hls.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    // console.log("fatal media error encountered, try to recover");
                    if(lastMediaError !== 0 && new Date() - lastMediaError < 1500) {
                        mtPlayer.hls.swapAudioCodec();
                    }
                    mtPlayer.hls.recoverMediaError();
                    lastMediaError = new Date();
                    break;
                default:
                    // cannot recover
                    advance_to_next_stream();
                    break;
            }
        }
    }

    function onload(success) {
        if(mtPlayer.isSuspended()) {
            //console.log("Suspended play by browser");
        }
        else {
            //console.log("SM2 ONLOAD, success:  " + success);
            if(success === true || success === "true") {
                var p_button = document.getElementById(widget_id + "play-button");
                p_button.classList.add("playing");
                p_button.classList.remove("error");
                p_button.classList.remove("loading");
                if(playStartDate == 0) {
                    playStartDate = new Date();
                }
                mtPlayer._isPlaying = true;
                mtPlayer._confirmedPlay = true;
            } else {
                advance_to_next_stream();
            }
        }
    }

    function initializeSM() {
        // skip if already loaded
        if (loaded_scripts["initializeSM"]) {
            return;
        }
        loaded_scripts["initializeSM"] = true;

        soundManager.setup({
            url: "https://cdnjs.cloudflare.com/ajax/libs/soundmanager2/2.97a.20150601/script/soundmanager2-jsmin.js",//"'https://mytuner-radio.com/static/js/sm2',
            flashVersion: 9,
            preferFlash: false,
            flashLoadTimeout: 10000,
            forceUseGlobalHTML5Audio:true,
            waitForWindowLoad: true,
            onready: runQueue,
        });
        //mtPlayer._sm2_initialized=true;
        globalSM._sm2_initialized=true;

        function runQueue() {
            globalSM_queue["initializeSM"].forEach(function(func) {
                func();
            });
        }
    }

    this.update = function() {
        if(!mtPlayer.isPlaying()) {
            var p_button = document.getElementById(widget_id + "play-button");
            p_button.classList.add("loading");
            p_button.classList.remove("error");
            p_button.classList.remove("playing");

            if(only_mms || next_index >= playlist.length) {
               //console.log("update error");
               mtPlayer.stop();
               var p_button = document.getElementById(widget_id + "play-button");
                p_button.classList.add("error");
                p_button.classList.remove("loading");
                p_button.classList.remove("playing");
               next_index = 0;
            } else {
                mtPlayer.play(playlist[next_index].file);
            }
        } else {
            mtPlayer.stop();
        }
    }

    function loadVolume() {
        var volume = localStorage.getItem("volume");
        if (!volume) {
            volume = 100;
        } else {
            volume_controller.value = volume;
        }
        return volume;
    }

    function soundIconRequiresChange(newVolume) {
        if(mtPlayer._isMuted) {
            return true;
        }
        var volState = 0;
        var newState = 0;
        if( mtPlayer._volume < 2 )
            volState = 1;
        else if (mtPlayer._volume < 33)
            volState = 2;
        else
            volState = 3;
        if( newVolume < 2 )
            newState = 1;
        else if (newVolume < 33)
            newState = 2;
        else
            newState = 3;
        return volState !== newState;
    }

    window.onbeforeunload = function (event) {
        if(playStartDate !== 0) {
            var elapsedTime = new Date();
            elapsedTime = elapsedTime - playStartDate;
            playStartDate = 0;
        }
        mtPlayer._isPlaying=false;
        localStorage.setItem("volume", mtPlayer._volume);
    };

}


function ajax(params) {

    let xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (this.status == 200) {
            params.success(this.response);
        } else {
            console.error(this.status + ": " + this.statusText);
            if(typeof(params.fail) === "function"){params.fail();}
        }
    };
    xhr.onerror = function() {
        console.error("Network Error");
        if(typeof(params.fail) === "function"){params.fail();}
    }

    //console.log("Calling:", params.type, params.url, !(params.async === false || params.async === "false"));

    xhr.open(params.type, params.url, !(params.async === false || params.async === "false"));
    xhr.responseType = "json";
    //xhr.setRequestHeader("Content-Type", "application/json");
    try {
        xhr.send(JSON.stringify(params.data));
    } catch (e) {
        console.error(e);
        if(typeof(params.fail) === "function"){params.fail();}
    }

}

})();
