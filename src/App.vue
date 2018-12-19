<template>
    <Transition appear appear-active-class="animated fadeIn slow">
        <div v-cloak id="app" class="no-select">
            <h2 class="header">Caça Sons</h2>

            <Soundbanks />
            <Shape />
            <BpmChooser :default="80" />

            <div id="dotsChooser">
                <span v-for="(dot, idx) in dots" :key="dot">
                    <span
                        class="possibleDot"
                        :class="{ active: dot === state.dot }"
                        @click.prevent.stop="state.dot = dot"
                        @touchstart.prevent.stop="state.dot = dot"
                        >{{ dot }}</span
                    >
                    <span v-if="idx !== dots.length - 1">&nbsp;/&nbsp;</span>
                </span>
            </div>

            <Controls />

            <div id="sheetToggle" @click="toggleSheet">
                <FontAwesomeIcon class="animated" icon="plus"></FontAwesomeIcon>
            </div>

            <Transition
                enter-active-class="animated bounceInDown"
                leave-active-class="animated bounceOutUp"
            >
                <Sheet v-show="state.showSheet" :numerator="4" />
            </Transition>
        </div>
    </Transition>
</template>

<script>
import Soundbanks from '@/components/Soundbanks.vue'
import Shape from '@/components/Shape.vue'
import BpmChooser from '@/components/BpmChooser.vue'
import Controls from '@/components/Controls.vue'
import Sheet from '@/components/Sheet.vue'

import { debounce } from 'lodash'
import { store } from '@/store'

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
        return {
            dots: [2, 3, 4],
            state: store.state,
        }
    },

    watch: {
        'state.dot': function() {
            const diff = this.state.dot - this.state.dots.length
            if (diff > 0) {
                // adding dots
                for (let i = 0; i < diff; i++)
                    this.state.dots.push({
                        bank: '',
                        sample: '',
                    })
            } else {
                // removing dots
                for (let i = 0; i < Math.abs(diff); i++) this.state.dots.pop()
            }
            this.$root.$emit('dotschange', diff)
        },
    },

    created() {
        const params = new URLSearchParams(window.location.search)
        const utmSource = params.get('utm_source')
        this.state.pwa = utmSource === 'homescreen'

        for (let i = 0; i < this.state.dot; i++) {
            this.state.dots.push({
                bank: '',
                sample: '',
            })
        }
    },

    mounted() {
        document.addEventListener('keypress', e => {
            if (e.key == 2 || e.key == 3 || e.key == 4) {
                this.state.dot = Number.parseInt(e.key)
                // store.changeDot(Number.parseInt(e.key))
            }
        })
        window.addEventListener(
            'resize',
            debounce(() => {
                this.$root.$emit('custom-resize')
            }, 250)
        )
    },

    methods: {
        toggleSheet(e) {
            this.state.showSheet = !this.state.showSheet
            e.srcElement.classList.add('rotateIn')
        },
    },
}
</script>

<style lang="scss">
@import 'styles/globals';

@import url('https://fonts.googleapis.com/css?family=Lato');

html,
body {
    box-sizing: border-box;
    max-width: 1366px;
    margin: 0 auto;
    font-family: 'Lato', sans-serif;
    height: 100vh;
    background: rgb(248, 249, 250);
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
        '.           controls    .'
        'sheetToggle .           .'
        '.           sheet       .';
}

.header {
    grid-area: header;
    font-size: 2em;
}

#sheetToggle {
    grid-area: sheetToggle;
    opacity: 0.8;
    &:hover {
        cursor: pointer;
        opacity: 1;
        // transform: rotate(45deg);
        // transform: scale(1.1);
    }
    color: var(--accent);
    font-size: 1.5em;
    transition: all 0.2s ease;
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
        // padding: 1px;
        // margin: 2.5px;
        letter-spacing: 3px;
    }
}

// @TODO: this should be able to be at the top for better clarity
@import 'styles/breakpoints';
@import '~animate.css';
</style>
