<template>
    <div class="bpms">
        <div
            v-for="(option, index) in options"
            :key="option"
            class="bpm"
            :class="{
                active: option === bpm,
                'prev-active': index === optionActiveIdx - 1,
                'next-active': index === optionActiveIdx + 1,
            }"
            @click.prevent.stop="change(option)"
            @touchstart.prevent.stop="change(option)"
        >
            {{ option }}
        </div>
    </div>
</template>

<script>
import Tone from 'tone'
import { mapState, mapMutations } from 'vuex'

export default {
    name: 'BpmChooser',

    data() {
        return {
            options: [44, 52, 60, 80, 100, 120, 140],
        }
    },

    computed: {
        ...mapState(['bpm']),

        optionActiveIdx() {
            return this.options.findIndex(bpm => bpm === this.bpm)
        },
    },

    mounted() {
        this.change(this.bpm)
    },

    methods: {
        ...mapMutations(['setBpm']),

        change(bpm) {
            this.setBpm(bpm)
            Tone.Transport.bpm.value = this.bpm
        },
    },
}
</script>

<style lang="scss">
.bpms {
    --border-width: 3px;
    --border: var(--border-width) solid black;
    --border-bg: 1px solid var(--white);
    --border-sep: 2px dashed var(--dark-grey);
    --bpm-side: 2.7em;

    div {
        text-align: center;
    }

    &:hover {
        cursor: pointer;
    }

    border-radius: 5px;
    box-shadow: 0 0 5px var(--dark-grey);

    .bpm {
        &:first-child {
            border-top-left-radius: 5px;
            border-top-right-radius: 5px;
        }

        &:last-child {
            border-bottom-left-radius: 5px;
            border-bottom-right-radius: 5px;
        }

        box-sizing: border-box;
        width: var(--bpm-side);
        height: var(--bpm-side);
        display: grid;
        align-items: center;
        font-size: 1em;
    }

    @media (min-width: 768px) {
        .bpm {
            border-bottom: var(--border-sep);
            border-left: var(--border);
            border-right: var(--border);

            &:first-child {
                border-top: var(--border);
            }

            &:last-child {
                border-bottom: var(--border);
            }

            &.active {
                border: var(--border-width) solid var(--accent) !important;
                font-weight: bold;
            }

            &.prev-active {
                border-bottom: var(--border-bg);
            }

            &.next-active {
                border-top: var(--border-bg);
            }
        }
    }
    @media (max-width: 768px) {
        display: flex;
        .bpm {
            border-top-style: none;
            border-right-style: none;
            border-left-style: none;
            border-bottom-style: none;
            border-right: var(--border-sep);
            border-top: var(--border);
            border-bottom: var(--border);

            &:first-child {
                border-left: var(--border);
            }

            &:last-child {
                border-right: var(--border);
            }

            &.active {
                border: var(--border-width) solid var(--accent) !important;
                font-weight: bold;
            }

            &.prev-active {
                border-right: none;
            }
        }
    }
}
</style>
