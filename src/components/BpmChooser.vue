<template>
    <div class="bpms" :class="orientation">
        <div
            v-for="option in options"
            :key="option"
            class="bpm no-select"
            :class="{ active: option === bpm }"
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

    mounted() {
        this.change(this.bpm)
        window.addEventListener('resize', this.resize)
        this.resize()
    },

    methods: {
        change(bpm) {
            this.bpm = bpm
            Tone.Transport.bpm.value = this.bpm
            // document.querySelectorAll('#bpms div').forEach(bpmDiv => {
            //     bpmDiv.style.borderBottom = '';
            // });
            // document.querySelector(
            //     '#bpms .active'
            // ).previousSibling.style.borderBottom = 'none';
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
    --bpm-side: 3em;
    div {
        text-align: center;
    }
    &:hover {
        cursor: pointer;
    }
    .bpm {
        box-sizing: border-box;
        // --bpm-side: 44px;
        width: var(--bpm-side);
        height: var(--bpm-side);
        display: grid;
        align-items: center;
        font-size: 1em;
    }
    &.vertical {
        div {
            border-bottom: 1px dashed var(--light-grey);
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
        }
    }
    &.horizontal {
        display: flex;
        div {
            border: none;
            border-right: 1px dashed var(--light-grey);
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
        }
    }
}
</style>
