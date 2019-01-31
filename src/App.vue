<template>
    <Transition appear appear-active-class="animated fadeIn slow">
        <div v-cloak id="app" class="no-select" @resize="resize">
            <h2 class="header">Caça Sons</h2>

            <Soundbanks id="soundbanks" />
            <Shape id="shape" />
            <BpmChooser id="bpms" />

            <div id="dotsChooser">
                <span v-for="(d, idx) in dots" :key="idx">
                    <span
                        class="possibleDot"
                        :class="{ active: d === dot }"
                        @click.prevent.stop="changeDot(d)"
                        @touchstart.prevent.stop="changeDot(d)"
                        >{{ d }}</span
                    >
                    <span v-if="idx !== dots.length - 1">&nbsp;/&nbsp;</span>
                </span>
            </div>

            <Controls id="controls" />

            <div id="secondaryControls">
                <FontAwesomeIcon icon="trash" class="trash" @click="trash" />
            </div>

            <div id="sheetToggle" @click="toggleSheet()">
                <Transition
                    enter-active-class="animated fadeIn faster"
                    leave-active-class="animated fadeOut faster"
                    mode="out-in"
                >
                    <FontAwesomeIcon
                        v-if="!showSheet"
                        key="plus"
                        icon="plus"
                    ></FontAwesomeIcon>
                    <FontAwesomeIcon
                        v-else
                        key="minus"
                        icon="minus"
                    ></FontAwesomeIcon>
                </Transition>
            </div>

            <Transition
                enter-active-class="animated bounceInDown"
                leave-active-class="animated bounceOutUp"
            >
                <!-- <Sheet v-show="showSheet" id="sheet" /> -->
            </Transition>
        </div>
    </Transition>
</template>

<script>
import Soundbanks from '@/components/Soundbanks'
import Shape from '@/components/Shape'
import BpmChooser from '@/components/BpmChooser'
import Controls from '@/components/Controls'
import Sheet from '@/components/Sheet/Sheet'

import { mapState, mapMutations } from 'vuex'
import { debounce } from 'lodash'

import { NoteFactory } from '@/store'

export default {
    name: 'App',

    components: {
        BpmChooser,
        Controls,
        Shape,
        Sheet,
        Soundbanks,
    },

    data() {
        return {}
    },

    computed: {
        ...mapState([
            'dot',
            'dots',
            'notes',
            'playing',
            'sampleActive',
            'pwa',
            'showSheet',
        ]),
    },

    watch: {
        dot: function() {
            const diff = this.dot - this.notes.length
            if (diff > 0) {
                // adding dots
                for (let i = 0; i < diff; i++) this.notes.push(NoteFactory())
            } else {
                // removing dots
                for (let i = 0; i < Math.abs(diff); i++) this.notes.pop()
            }

            // when would try to play dots not shown in shape
            if (
                this.playing &&
                diff < 0 &&
                this.dotActive >= this.notes.length
            ) {
                this.setDotActive(-1)
            }
        },
    },

    created() {
        document.addEventListener('keypress', this.keypress)

        this.$store.commit(
            'setIsPwa',
            new URLSearchParams(window.location.search).get('utm_source') ===
                'homescreen'
        )

        // Prevent context menu on mobile on long press
        window.oncontextmenu = e => {
            e.preventDefault()
            e.stopPropagation()
            return false
        }

        for (let i = 0; i < this.dot; i++) {
            this.notes.push(NoteFactory())
        }
    },

    methods: {
        ...mapMutations([
            'changeDot',
            'togglePlaying',
            'toggleSheet',
            'setDotActive',
        ]),

        trash() {
            this.notes.map(() => NoteFactory())
            this.$root.$emit('dotsclear')
        },

        keypress(e) {
            switch (e.key) {
                case ' ':
                    this.togglePlaying()
                    break
                case '2':
                case '3':
                case '4':
                    this.changeDot(Number.parseInt(e.key))
                    break
            }
        },

        resize() {
            debounce(() => this.$root.$emit('debouncedresize'), 100)
        },
    },
}
</script>

<style lang="scss">
@import 'assets/styles/globals';
@import 'assets/styles/breakpoints';
@import '~animate.css';

@import url('https://fonts.googleapis.com/css?family=Lato');

html,
body {
    box-sizing: border-box;
    max-width: 1366px;
    margin: 0 auto;
    font-family: 'Lato', sans-serif;
    height: 100vh;
    background: var(--bg);
}

#app {
    display: grid;
    justify-items: center;
    align-items: center;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
    grid-template-areas:
        'header      header      header'
        'soundbank   shape       bpms'
        '.           dotsChooser .'
        '.           controls    secondaryControls'
        'sheetToggle .           .'
        '.           sheet       .';
}

.header {
    grid-area: header;
    font-size: 2em;
}

#soundbanks {
    grid-area: soundbank;
}

#shape {
    grid-area: shape;
}

#bpms {
    grid-area: bpms;
}

#dotsChooser {
    grid-area: dotsChooser;
    .possibleDot {
        cursor: pointer;
        font-size: 1.1em;
    }
    .active {
        font-size: 2.2em;
        font-weight: bold;
    }
    span {
        padding: 1px;
        margin: 2.5px;
        letter-spacing: 5px;
    }
}

#controls {
    grid-area: controls;
}

#secondaryControls {
    grid-area: secondaryControls;
    .trash {
        margin-top: 20px;
        background: var(--light-grey);
        width: 30px !important;
        height: 30px;
        border-radius: 50%;
        padding: 10px;
        transition: all 0.1s linear;
        &:hover {
            cursor: pointer;
            background: var(--dark-grey);
        }
    }
}

#sheetToggle {
    grid-area: sheetToggle;
    opacity: 0.8;
    &:hover {
        cursor: pointer;
        opacity: 1;
    }
    color: var(--accent);
    font-size: 1.5em;
    transition: all 0.3s ease;
    .animating {
        transform: rotate(90deg);
    }
}

#sheet {
    grid-area: sheet;
    transition: opacity 1s linear;
}
</style>
