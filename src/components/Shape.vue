<template>
    <div class="shape">
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
                    class="line animated fadeIn slow"
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
                        class="dot animated"
                        :class="{
                            active: idx === state.dotActive,
                        }"
                        @click="click($event, idx)"
                        @dragover="dragover"
                        @drop="click($event, idx)"
                    ></circle>
                    <!-- <text :x="dot.x - 5" :y="dot.y + 5">{{ idx + 1 }}</text> -->
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
import { TweenMax } from 'gsap/TweenMax'

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
            this.reset(newDot, oldDot)
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

            this.update(false)

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
            Vue.set(this.dots[dot.idx], 'image', dot.src)
            Vue.set(this.dots[dot.idx], 'sample', dot.sample)
        },

        resize() {
            // TODO:
            // this.update()
        },

        reset(newDot, oldDot) {
            const diff = newDot - oldDot
            // prettier-ignore
            const nlines = this.state.dot === 4 || this.state.dot === 3 ? this.state.dot : 1
            if (diff < 0) {
                for (let i = 0; i < Math.abs(diff); i++) {
                    this.dots.pop()
                }
                this.lines = this.lines.slice(0, nlines)
            } else {
                const createNewDotFrom = idx => {
                    this.dots.push({
                        x: this.dots[idx].x,
                        y: this.dots[idx].y,
                        image: '',
                    })
                }
                const createNewLineFrom = (idx1, idx2) => {
                    this.lines.push({
                        x1: this.dots[idx1].x,
                        y1: this.dots[idx1].y,
                        x2: this.dots[idx2].x,
                        y2: this.dots[idx2].y,
                    })
                }
                if (oldDot === 3 && newDot === 4) {
                    createNewDotFrom(2)
                    createNewLineFrom(3, 0)
                } else if (oldDot === 2 && newDot == 3) {
                    createNewDotFrom(1)
                    createNewLineFrom(2, 1)
                    createNewLineFrom(2, 0)
                } else if (oldDot === 2 && newDot == 4) {
                    createNewDotFrom(1)
                    createNewDotFrom(1)
                    createNewLineFrom(1, 2)
                    createNewLineFrom(2, 3)
                    createNewLineFrom(3, 0)
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
            const r = this.r
            const dot = this.$el.querySelectorAll('.dot')[idx]
            const animationSpeed = 0.08
            TweenMax.to(dot, animationSpeed, {
                attr: { r: r * 1.5 },
                onComplete: () => {
                    TweenMax.to(dot, animationSpeed, { attr: { r } })
                },
            })
            if (note.bank === '' || note.sample == '') return
            this.state.players[note.bank].get(note.sample).start(time)
        },

        update(animate = true) {
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

            const animationSpeed = 0.8

            const updateDot = (idx, x, y, animate = true) => {
                if (!animate) {
                    Vue.set(this.dots[idx], 'x', x)
                    Vue.set(this.dots[idx], 'y', y)
                } else {
                    TweenMax.to(this.dots[idx], animationSpeed, { x, y })
                }
            }
            const updateLine = (idx, x1, y1, x2, y2) => {
                if (!this.lines[idx]) {
                    this.lines.splice(idx, 1, { x1, y1, x2, y2 })
                }
                if (!animate) {
                    Vue.set(this.lines[idx], 'x1', x1)
                    Vue.set(this.lines[idx], 'y1', y1)
                    Vue.set(this.lines[idx], 'x2', x2)
                    Vue.set(this.lines[idx], 'y2', y2)
                } else {
                    // Vue.set(this.lines[idx], 'x1', x1)
                    // Vue.set(this.lines[idx], 'y1', y1)
                    // Vue.set(this.lines[idx], 'x2', x2)
                    // Vue.set(this.lines[idx], 'y2', y2)
                    TweenMax.to(this.lines[idx], animationSpeed, {
                        x1,
                        y1,
                        x2,
                        y2,
                    })
                }
            }

            switch (this.state.dot) {
                case 2:
                    updateDot(0, x3, y1, animate)
                    updateDot(1, x3, y2, animate)
                    updateLine(0, x3, y1, x3, y2)
                    break

                case 3:
                    updateDot(0, x3, y3, animate)
                    updateDot(1, x2, y2, animate)
                    updateDot(2, x1, y2, animate)
                    updateLine(0, x3, y3, x2, y2)
                    updateLine(1, x2, y2, x1, y2)
                    updateLine(2, x1, y2, x3, y3)
                    break

                case 4:
                default:
                    updateDot(0, x1, y1, animate)
                    updateDot(1, x2, y1, animate)
                    updateDot(2, x2, y2, animate)
                    updateDot(3, x1, y2, animate)
                    updateLine(0, x1, y1, x2, y1)
                    updateLine(1, x2, y1, x2, y2)
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
svg {
    overflow: visible;
}

.shape {
    width: 300px;
    height: 300px;
    image:hover {
        cursor: pointer; // TODO: this should not be a pointer if there's no activeSample selected
    }
}
.dot {
    fill: var(--accent);
    &.active {
        // stroke: var(--dark-grey);
        // stroke-width: 5px;
    }
    image {
        width: 50px;
    }
    // opacity: 0;
}
</style>
