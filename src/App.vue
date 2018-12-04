<template>
    <div id="app" v-cloak class="no-select">
        <h2 class="header">Caça Sons</h2>

        <Soundbanks class="no-select"/>
        <Shape/>
        <BpmChooser :default="60"/>

        <div id="dotsChooser" class="no-select">
            <span v-for="(dot, idx) in dots" :key="dot">
                <span
                    class="possibleDot"
                    :class="{active: dot === shared.dot}"
                    @click="changeDot(dot)"
                >{{ dot }}</span>
                <span v-if="idx !== dots.length - 1">&nbsp;/&nbsp;</span>
            </span>
        </div>

        <Controls class="no-select"/>

        <div id="open" class="control cursor-hover">
            <i class="fa fa-plus" @click="toggleSheet"></i>
        </div>

        <Sheet :numerator="3" class="no-select"/>
    </div>
</template>

<script>
import Soundbanks from './components/Soundbanks.vue';
import Shape from './components/Shape.vue';
import BpmChooser from './components/BpmChooser.vue';
import Controls from './components/Controls.vue';
import Sheet from './components/Sheet.vue';

import { throttle, debounce } from 'lodash';
import { store } from './store';

export default {
    name: 'app',
    data() {
        return {
            dots: [2, 3, 4],
            shared: store.state
        };
    },
    components: {
        BpmChooser,
        Controls,
        Shape,
        Sheet,
        Soundbanks
    },
    methods: {
        changeDot(dot) {
            store.changeDot(dot);
        },
        toggleSheet() {
            store.toggleSheet();
        }
    },
    mounted() {
        document.addEventListener('keypress', e => {
            if (e.key == 2 || e.key == 3 || e.key == 4)
                store.changeDot(Number.parseInt(e.key));
        });
        let fn = debounce(() => {
            this.$root.$emit('custom-resize');
        }, 250);
        window.addEventListener('resize', fn);
    }
};
</script>

<style lang="scss">
@import "globals";

@import url("https://fonts.googleapis.com/css?family=Lato");

html,
body {
    box-sizing: border-box;
    max-width: 1366px;
    margin: 0 auto;
    font-family: "Lato", sans-serif;
    // font-family: "Helvetica";
    height: 100vh;
}

#app {
    display: grid;
    justify-items: center;
    align-items: center;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
    grid-template-areas:
        "header      header      header"
        "soundbank   shape       bpms"
        "dotsChooser dotsChooser dotsChooser"
        "controls    controls    controls"
        "open        .           ."
        ".           sheet       .";
}

.header {
    grid-area: header;
    font-size: 2em;
}

#open {
    grid-area: open;
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
@import "breakpoints";
</style>
