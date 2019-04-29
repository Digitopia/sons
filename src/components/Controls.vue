<template>
    <div class="controls">
        <div v-if="!isPwa && isFullscreenCapable" class="control fullscreen">
            <FontAwesomeIcon icon="expand" @click="toggleFullscreen" />
            <span>FULLSCREEN</span>
        </div>
        <div v-else></div>
        <div class="control">
            <FontAwesomeIcon
                class="play"
                :icon="['far', playing ? 'stop-circle' : 'play-circle']"
                @click="$store.commit('togglePlaying')"
            />
            <span>{{ playing ? 'STOP' : 'PLAY' }}</span>
        </div>
        <div class="control">
            <FontAwesomeIcon :icon="['far', 'dot-circle']" @click="record()" />
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
import { mapState, mapMutations } from 'vuex'

import screenfull from 'screenfull'
import Tone from 'tone'
import FileSaver from 'file-saver'

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
            recording: false,
        }
    },

    computed: {
        ...mapState(['playing', 'dotActive', 'isPwa']),
        isFullscreenCapable: () => screenfull.enabled,
    },

    watch: {
        playing: function() {
            if (this.playing) this.play()
            else this.stop()
        },
    },

    created() {
        this.recorder = new window.Recorder(Tone.Master.input)
    },

    methods: {
        ...mapMutations(['togglePlaying', 'setDotActive']),

        play() {
            if (Tone.context.state === 'suspended') Tone.context.resume()
            Tone.Transport.position = '0:0:0'
            Tone.Transport.start()
        },

        stop() {
            Tone.Transport.stop()
            this.setDotActive(-1)
        },

        record() {
            if (!this.playing) this.setPlaying('true')
            this.recording = !this.recording
            if (this.recording) {
                this.recorder.record()
            } else {
                this.recorder.stop()
                this.recorder.exportWAV(blob => {
                    FileSaver.saveAs(blob, 'Gravação Caça Sons.wav')
                })
                this.setPlaying(false)
            }
        },

        toggleFullscreen() {
            screenfull.toggle()
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
            color: rgba(0, 0, 0, 0.8);
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
