<template>
    <div id="controls">
        <FontAwesomeIcon icon="expand" @click="fullscreen"></FontAwesomeIcon>
        <FontAwesomeIcon
            class="play"
            :icon="['far', state.playing ? 'stop-circle' : 'play-circle']"
            @click="state.playing = !state.playing"
        ></FontAwesomeIcon>
        <FontAwesomeIcon :icon="['far', 'dot-circle']"></FontAwesomeIcon>
        <div class="control-text">FULLSCREEN</div>
        <div class="control-text">{{ state.playing ? 'STOP' : 'PLAY' }}</div>
        <div class="control-text">REC</div>
    </div>
</template>

<script>
import Vue from 'vue'

import screenfull from 'screenfull'
import Tone from 'tone'
import FileSaver from 'file-saver'
import { store } from '@/store'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faExpand, faPlus } from '@fortawesome/free-solid-svg-icons'
import {
    faPlayCircle,
    faStopCircle,
    faDotCircle,
} from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(faExpand, faPlayCircle, faStopCircle, faDotCircle, faPlus)
Vue.component('FontAwesomeIcon', FontAwesomeIcon)

export default {
    name: 'Controls',
    data() {
        return {
            state: store.state,
            recording: false,
        }
    },
    watch: {
        'state.playing': function() {
            if (this.state.playing) this.play()
            else this.stop()
        },
    },
    mounted() {},
    methods: {
        play() {
            if (Tone.context.state === 'suspended') Tone.context.resume()
            Tone.Transport.position = '0:0:0'
            Tone.Transport.start()
        },
        stop() {
            Tone.Transport.stop()
        },
        record() {
            this.recording = !this.recording
            if (this.recording) {
                this.recorder.record()
            } else {
                this.recorder.stop()
                this.recorder.exportWAV(blob => {
                    FileSaver.saveAs(blob, 'Gravação Caça Sons.wav')
                })
            }
        },
        fullscreen() {
            console.log('fullscreen')
            if (screenfull.enabled) screenfull.toggle()
        },
    },
}
</script>

<style lang="scss">
#controls {
    grid-area: controls;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    justify-items: center;
    align-items: center;
    svg {
        font-size: 2em;
        &:hover {
            cursor: pointer;
        }
        &:focus {
            outline: none;
        }
    }
}
svg.play {
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
