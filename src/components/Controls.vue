<template>
    <div class="controls">
        <div v-if="!state.pwa" class="control fullscreen">
            <FontAwesomeIcon icon="expand" @click="toggleFullscreen" />
            <span>FULLSCREEN</span>
        </div>
        <div v-else></div>
        <div class="control">
            <FontAwesomeIcon
                class="play"
                :icon="['far', state.playing ? 'stop-circle' : 'play-circle']"
                @click="state.playing = !state.playing"
            />
            <span>{{ state.playing ? 'STOP' : 'PLAY' }}</span>
        </div>
        <div class="control">
            <FontAwesomeIcon :icon="['far', 'dot-circle']" @click="record" />
            <span
                :class="{ 'recording animated flash infinite slow': recording }"
                >REC</span
            >
        </div>

        <!-- <FontAwesomeIcon icon="info-circle" /> -->
    </div>
</template>

<script>
import Vue from 'vue'

import screenfull from 'screenfull'
import Tone from 'tone'
import FileSaver from 'file-saver'
import { store } from '@/store'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
    faExpand,
    faPlus,
    faMinus,
    faTrash,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons'
import {
    faPlayCircle,
    faStopCircle,
    faDotCircle,
} from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(
    faExpand,
    faPlayCircle,
    faStopCircle,
    faDotCircle,
    faPlus,
    faMinus,
    faTrash,
    faInfoCircle
)
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

    created() {
        this.recorder = new window.Recorder(Tone.Master.input)
    },

    methods: {
        play() {
            if (Tone.context.state === 'suspended') Tone.context.resume()
            Tone.Transport.position = '0:0:0'
            Tone.Transport.start()
        },

        stop() {
            Tone.Transport.stop()
            this.state.dotActive = -1 // since we're using Tone.Loop instead of Tone.Sequenece e. g.
        },

        record() {
            if (!this.state.playing) this.state.playing = true
            this.recording = !this.recording
            if (this.recording) {
                this.recorder.record()
            } else {
                this.recorder.stop()
                this.recorder.exportWAV(blob => {
                    FileSaver.saveAs(blob, 'Gravação Caça Sons.wav')
                })
                this.state.playing = false
            }
        },

        toggleFullscreen() {
            if (screenfull.enabled) screenfull.toggle()
        },
    },
}
</script>

<style lang="scss">
.controls {
    display: flex;
    align-items: center;
    justify-items: flex-start;
    text-align: center;
    svg {
        font-size: 2em;
        &:hover {
            cursor: pointer;
        }
        &:focus {
            outline: none;
        }
    }
    .control {
        width: 100px;
        display: inline-block;
        .control-text {
            padding-top: 2px;
            color: grey;
            font-size: 10px;
        }
        span {
            display: block;
            text-align: center;
        }
    }
    .recording {
        color: rgb(231, 2, 2);
    }
    svg.play {
        font-size: 3.5em !important;
    }
}
</style>
