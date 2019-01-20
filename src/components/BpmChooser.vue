<template>
    <div class="bpms" :class="orientation">
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

export default {
    name: 'BpmChooser',

    props: {
        default: {
            type: Number,
            default: 60,
        },
    },

    data() {
        return {
            options: [44, 52, 60, 80, 100, 120, 140],
            bpm: this.default,
            orientation: 'vertical',
        }
    },

    computed: {
        optionActiveIdx() {
            return this.options.findIndex(bpm => bpm === this.bpm)
        },
    },

    mounted() {
        this.change(this.bpm)
        window.addEventListener('resize', this.resize)
        this.resize()
    },

    methods: {
        change(bpm) {
            this.bpm = bpm
            Tone.Transport.bpm.value = this.bpm
        },

        resize() {
            this.orientation =
                window.innerWidth >= 768 ? 'vertical' : 'horizontal'
        },
    },
}
</script>

<style lang="scss">
.bpms {
    --border-width: 6px;
    --border: var(--border-width) solid black;
    --border-bg: 1px solid var(--white);
    --border-sep: 1px dashed var(--light-grey);
    --bpm-side: 3em;
    div {
        text-align: center;
    }
    &:hover {
        cursor: pointer;
    }
    .bpm {
        box-sizing: border-box;
        width: var(--bpm-side);
        height: var(--bpm-side);
        display: grid;
        align-items: center;
        font-size: 1em;
    }
    &.vertical {
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
    &.horizontal {
        display: flex;
        .bpm {
            border: none;
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
