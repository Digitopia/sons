<template>
    <Transition appear appear-active-class="animated fadeIn slow">
        <div v-cloak id="app">
            <h2 class="header">CAÇA SONS</h2>

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
                <ul>
                    <li>
                        <FontAwesomeIcon
                            icon="trash"
                            class="trash"
                            @click="trash"
                        />
                    </li>
                    <li>
                        <FontAwesomeIcon
                            icon="eraser"
                            class="trash"
                            :class="{ eraserActive: isEraserOn }"
                            @click="$store.commit('toggleEraser')"
                        />
                    </li>
                </ul>
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
                <SheetVexFlow v-show="showSheet" id="sheet" />
            </Transition>
        </div>
    </Transition>
</template>

<script>
import Soundbanks from '@/components/Soundbanks'
import Shape from '@/components/Shape'
import BpmChooser from '@/components/BpmChooser'
import Controls from '@/components/Controls'
import SheetVexFlow from '@/components/SheetVexFlow'

import { mapState, mapMutations, mapGetters } from 'vuex'
// import { debounce } from 'lodash'

import { NoteFactory } from '@/store'

export default {
    name: 'App',

    components: {
        BpmChooser,
        Controls,
        Shape,
        SheetVexFlow,
        Soundbanks,
    },

    data() {
        return {
            bpms: [44, 52, 60, 80, 100, 120, 140],
        }
    },

    computed: {
        ...mapState([
            'banks',
            'dot',
            'dots',
            'isEraserOn',
            'isPwa',
            'notes',
            'playing',
            'sampleActive',
            'showSheet',
        ]),

        ...mapGetters(['ndots']),
    },

    watch: {
        dot() {
            const diff = this.ndots - this.notes.length
            if (diff > 0) {
                // adding dots
                for (let i = 0; i < diff; i++) this.notes.push(NoteFactory())
            } else {
                // removing dots
                this.setNotes(this.notes.slice(0, this.ndots))
            }

            // when would try to play dots already not shown in shape
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

        window.addEventListener('resize', () => {
            this.$root.$emit('debouncedresize')
        })

        this.$store.commit(
            'setIsPwa',
            new URLSearchParams(window.location.search).get('utm_source') ===
                'homescreen'
        )

        // Prevent context menu on mobile on long press
        // window.oncontextmenu = e => {
        //     e.preventDefault()
        //     e.stopPropagation()
        //     return false
        // }

        for (let i = 0; i < this.ndots; i++) {
            this.notes.push(NoteFactory())
        }

        // preload images
        this.banks.forEach(bank => {
            bank.sounds.forEach(sound => {
                new Image().src = sound.icon
            })
        })
    },

    methods: {
        ...mapMutations([
            'changeDot',
            'setDotActive',
            'setNotes',
            'toggleEraser',
            'togglePlaying',
            'toggleSheet',
        ]),

        trash() {
            this.$store.commit('clearNotes')
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
    },
}
</script>

<style lang="scss">
@import 'assets/styles/globals';
@import 'assets/styles/breakpoints';
@import '~animate.css';

@import url('https://fonts.googleapis.com/css?family=Lato');

html {
    background: radial-gradient(
            50% 50% at 50% 50%,
            #ffffff 0%,
            rgba(248, 187, 43, 0.25) 100%
        )
        no-repeat 100% 0% / 100% 100%;
}

html,
body {
    box-sizing: border-box;
    max-width: 1000px;
    margin: 0 auto;
    font-family: 'Lato', sans-serif;
    // height: 100vh;
    background: var(--bg);
}

#app {
    height: 100vh;
    margin-top: 60px;
    display: grid;
    justify-items: center;
    align-items: center;
    grid-template-columns: 25fr 50fr 25fr;
    grid-gap: 10px;
    grid-template-areas:
        'header      header      header'
        'soundbank   shape       bpms'
        '.           dotsChooser .'
        '.           controls    secondaryControls'
        'sheetToggle .           .'
        '.           sheet   .';
}

.header {
    grid-area: header;
    font-size: 2em;
    letter-spacing: 6px;
    margin-bottom: 60px;
    user-select: auto;
    -webkit-user-select: auto;
    -ms-user-select: auto;
    -webkit-touch-callout: auto;
    -o-user-select: auto;
    -moz-user-select: auto;
}

#soundbanks {
    grid-area: soundbank;
    // justify-self: right;
}

#shape {
    grid-area: shape;
}

#bpms {
    grid-area: bpms;
    // justify-self: left;
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
    margin-top: 30px;
}

#secondaryControls {
    grid-area: secondaryControls;
    ul {
        padding: 0;
        li {
            list-style: none;
        }
    }
    .eraserActive {
        background: var(--accent);
    }
    .trash {
        margin-top: 20px;
        // background: var(--light-grey);
        border: 1px solid var(--light-grey);
        border-radius: 50%;
        width: 30px !important;
        height: 30px;
        border-radius: 50%;
        padding: 10px;
        // transition: all 0.1s linear;
        &:hover {
            cursor: pointer;
            // color: var(--accent);
            border-color: var(--accent);
            // background: var(--dark-grey);
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
    width: 100%;
    height: 100%;
}
</style>
