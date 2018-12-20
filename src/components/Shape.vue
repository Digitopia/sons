<template>
    <div id="shape">
        <svg id="svg" width="100%" height="100%">
            <g class="lines">
                <line
                    v-for="(line, idx) in lines"
                    :key="idx"
                    :x1="line.x1"
                    :x2="line.x2"
                    :y1="line.y1"
                    :y2="line.y2"
                    stroke="black"
                    stroke-width="10"
                />
            </g>
            <g class="dots">
                <g v-for="(dot, idx) in dots" :key="`dot-${idx}`">
                    <circle
                        :key="idx"
                        :cx="dot.x"
                        :cy="dot.y"
                        :data-dot="idx"
                        :r="r"
                        class="dot"
                        :class="{
                            active: idx === state.dotActive,
                        }"
                        @click="click($event, idx)"
                        @dragover="dragover"
                        @drop="click($event, idx)"
                    ></circle>
                    <image
                        :href="dot.image"
                        :set="(factor = 0.8)"
                        :x="dot.x - r * factor"
                        :y="dot.y - r * factor"
                        :width="r * 2 * factor"
                        @dragover="dragover"
                        @drop="click($event, idx)"
                        @click="click($event, idx)"
                        @touchstart="click($event, idx)"
                    />
                </g>
            </g>
        </svg>
    </div>
</template>

<script>
import { store } from '../store'
import Tone from 'tone'
import Shake from 'shake.js'
import Vue from 'vue'

export default {
    name: 'Shape',

    data() {
        return {
            state: store.state,
            dots: [],
            lines: [],
            r: 22,
        }
    },

    watch: {
        'state.dot': function(newDot, oldDot) {
            const diff = newDot - oldDot
            this.reset(diff)
            this.update()
        },
    },

    created() {
        for (let i = 0; i < this.state.dot; i++) {
            this.dots.push({
                x: 0,
                y: 0,
                image: '',
            })
        }
    },

    mounted() {
        this.init()
        this.$root.$on('dotchange', this.dotChanged)
        this.$root.$on('dotstep', this.dotStepped)
        this.$root.$on('dotsclear', this.clear)
    },

    methods: {
        init() {
            this.loop = new Tone.Loop(time => {
                this.state.dotActive =
                    (this.state.dotActive + 1) % this.state.dot
                const idx = this.state.dotActive
                const note = this.state.dots[idx]
                this.$root.$emit('dotstep', { idx, note, time })
            }, '4n').start(0)

            this.update()

            this.$root.$on('custom-resize', this.resize)

            this.initShake()
        },

        initShake() {
            new Shake({ threshold: 10, timeout: 1000 }).start()

            window.addEventListener(
                'shake',
                () => {
                    this.$root.$emit('shaked')
                },
                false
            )

            this.$root.$on('shaked', () => {
                this.reset()
                this.state.playing = false
            })
        },

        dotChanged(dot) {
            console.log('shape dotchange', dot)
            Vue.set(this.dots[dot.idx], 'image', dot.src)
            Vue.set(this.dots[dot.idx], 'sample', dot.sample)
        },

        resize() {
            // TODO:
            // this.update()
        },

        reset(diff) {
            console.log({ diff })
            // prettier-ignore
            const nlines = this.state.dot === 4 || this.state.dot === 3 ? this.state.dot : 1
            if (diff < 0) {
                for (let i = 0; i < Math.abs(diff); i++) {
                    this.dots.pop()
                }
                this.lines = this.lines.slice(0, nlines)
            } else {
                for (let i = 0; i < diff; i++) {
                    this.dots.push({
                        x: 0,
                        y: 0,
                        image: '',
                    })
                }
            }
        },

        clear() {
            this.dots.forEach(dot => {
                dot.image = ''
                dot.sample = ''
            })
        },

        dotStepped({ idx, note, time }) {
            console.log(idx, note, time)
            // snap version
            // if (!this.dots[idx]) return
            // this.dots[idx].animate(
            //     { r: this.r * 1.5 },
            //     80,
            //     window.mina.easinout,
            //     () => {
            //         this.dots[idx].animate({ r: this.r }, 80)
            //     }
            // )
            if (note.bank === '' || note.sample == '') return
            this.state.players[note.bank].get(note.sample).start(time)
        },

        update() {
            const w = this.$el.clientWidth
            const h = this.$el.clientHeight
            const { r } = this
            const padding = r * 0.5
            const x1 = r + padding
            const x2 = w - padding - r
            const x3 = w / 2
            const rb = x2 - x1
            const y1 = x1
            const y2 = h - padding - r
            const y3 = y2 - Math.sqrt(rb ** 2 - (rb / 2) ** 2)

            const updateDot = (idx, x, y) => {
                Vue.set(this.dots[idx], 'x', x)
                Vue.set(this.dots[idx], 'y', y)
                // this.dots.splice(idx, 1, { x, y })
            }
            const updateLine = (idx, x1, y1, x2, y2) => {
                this.lines.splice(idx, 1, { x1, y1, x2, y2 })
            }

            switch (this.state.dot) {
                case 2:
                    updateDot(0, x3, y1)
                    updateDot(1, x3, y2)
                    updateLine(0, x3, y1, x3, y2)
                    break

                case 3:
                    updateDot(0, x3, y3)
                    updateDot(1, x2, y2)
                    updateDot(2, x1, y2)
                    updateLine(0, x3, y3, x2, y2)
                    updateLine(1, x2, y2, x1, y2)
                    updateLine(2, x1, y2, x3, y3)
                    break

                case 4:
                default:
                    updateDot(0, x1, y1)
                    updateDot(1, x2, y1)
                    updateDot(2, x2, y2)
                    updateDot(3, x1, y2)
                    updateLine(0, x2, y1, x2, y2)
                    updateLine(1, x1, y1, x2, y1)
                    updateLine(2, x2, y2, x1, y2)
                    updateLine(3, x1, y2, x1, y1)
                    break
            }
        },

        click(evt, idx) {
            if (evt.preventDefault) evt.preventDefault()
            if (evt.stopPropagation) evt.stopPropagation()

            const dot = {
                bank: this.state.bank.id,
                sample: this.state.sampleActive.sample,
            }
            this.state.dots[idx] = dot
            this.$root.$emit('dotchange', {
                idx,
                ...dot,
                src: document.querySelector('img.active').getAttribute('src'),
            })
        },

        dragover(evt) {
            evt.preventDefault()
        },
    },
}
</script>

<style lang="scss">
#shape {
    grid-area: shape;
    width: 300px;
    height: 300px;
    image:hover {
        cursor: pointer; // TODO: this should not be a pointer if there's no activeSample selected
    }
}
.dot {
    fill: var(--accent);
    &.active {
        stroke: var(--dark-grey);
        stroke-width: 5px;
    }
    image {
        width: 50px;
    }
}
</style>
