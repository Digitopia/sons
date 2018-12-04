<template>
    <div id="controls">
        <i class="fa fa-expand" id="fullscreen" @click="fullscreen"></i>
        <i
            id="play"
            class="far"
            :class="playing ? 'fa-stop-circle' : 'fa-play-circle'"
            @click="play"
        ></i>
        <i id="record" class="far fa-dot-circle" :class="{recording: recording}" @click="record"></i>
        <div class="control-text">FULLSCREEN</div>
        <div class="control-text">PLAY</div>
        <div class="control-text">REC</div>
    </div>
</template>

<script>
import screenfull from 'screenfull';
import Tone from 'tone';
export default {
    name: 'Controls',
    data() {
        return {
            playing: false,
            recording: false
        };
    },
    mounted() {
        this.$root.$on('stop', () => {
            this.playing = false;
        });
    },
    methods: {
        play() {
            if (Tone.context.state === 'suspended') Tone.context.resume();
            this.playing = !this.playing;
            if (this.playing) {
                Tone.Transport.position = '0:0:0';
                Tone.Transport.start();
            } else {
                Tone.Transport.stop();
            }
        },
        record() {
            this.recording = !this.recording;
        },
        fullscreen() {
            console.log('fullscreen');
            if (screenfull.enabled) screenfull.toggle();
        }
    }
};
</script>

<style lang="scss">
#controls {
    grid-area: controls;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    justify-items: center;
    align-items: center;
    i {
        font-size: 2em;
        &:hover {
            cursor: pointer;
        }
        &:focus {
            outline: none;
        }
    }
}
#play {
    font-size: 3.5em !important;
}
.control-text {
    padding-top: 2px;
    color: grey;
    font-size: 10px;
}
.recording {
    color: red;
}
</style>
