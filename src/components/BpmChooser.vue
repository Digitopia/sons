<template>
    <div id="bpms" :class="orientation">
        <div
            class="bpm no-select"
            v-for="option in options"
            :key="option"
            :class="{ active: option === bpm }"
            @click="change(option)"
        >{{ option }}</div>
    </div>
</template>

<script>
import app from '../App.vue';
import Tone from 'tone';

export default {
    name: 'BpmChooser',
    data() {
        return {
            options: [30, 44, 52, 60, 80, 100, 120],
            bpm: this.default,
            orientation: 'vertical'
        };
    },
    props: {
        default: {
            type: Number,
            default: 60
        }
    },
    methods: {
        change(bpm) {
            this.bpm = bpm;
            Tone.Transport.bpm.value = this.bpm;
            // document.querySelectorAll('#bpms div').forEach(bpmDiv => {
            //     bpmDiv.style.borderBottom = '';
            // });
            // document.querySelector(
            //     '#bpms .active'
            // ).previousSibling.style.borderBottom = 'none';
        },
        resize() {
            this.orientation =
                window.innerWidth >= 768 ? 'vertical' : 'horizontal';
        }
    },
    mounted() {
        this.change(this.bpm);
        window.addEventListener('resize', this.resize);
        this.resize();
    }
};
</script>

<style lang="scss">
#bpms {
    grid-area: bpms;
    --border-width: 6px;
    --border: var(--border-width) solid black;
    --side: 3em;
    div {
        text-align: center;
    }
    &:hover {
        cursor: pointer;
    }
    .bpm {
        box-sizing: border-box;
        // --side: 44px;
        width: var(--side);
        height: var(--side);
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
