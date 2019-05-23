<template>
    <div class="shape" @shake="shaked">
        <svg id="svg" width="100%" height="100%">
            <g class="lines">
                <path
                    v-for="(line, idx) in lines"
                    :key="idx"
                    stroke="black"
                    stroke-width="10"
                    class="animated fadeIn slow"
                    fill="none"
                    :d="
                        `M${line.x1} ${line.y1} Q ${line.x3} ${line.y3} ${
                            line.x2
                        } ${line.y2}`
                    "
                ></path>
            </g>

            <g class="dots">
                <g v-for="(dot, idx) in dots" :key="`dot-${idx}`">
                    <circle
                        :key="idx"
                        :ref="`dot-${idx}`"
                        :cx="dot.x"
                        :cy="dot.y"
                        :data-dot="idx"
                        :r="dot.isSmall ? r * 0.75 : r"
                        class="dot animated"
                        :class="{ active: idx === dotActive }"
                        @click.prevent.stop="click(idx)"
                        @dragover.stop="drag"
                        @drop="click(idx)"
                    ></circle>

                    <!-- Label dots for debug purposes -->
                    <!-- <text :x="dot.x - 5" :y="dot.y + 5">{{ idx }}</text> -->

                    <image
                        v-bind="{ 'xlink:href': dot.image }"
                        :set="(factor = dot.isSmall ? 0.6 : 0.8)"
                        :x="dot.x - r * factor"
                        :y="dot.y - r * factor"
                        :width="r * 2 * factor"
                        :height="r * 2 * factor"
                        @dragover.prevent.stop="drag"
                        @drop.prevent="click(idx)"
                        @click="click(idx)"
                        @touchstart="click(idx)"
                    ></image>
                </g>
            </g>
        </svg>
    </div>
</template>

<script>
import Tone from 'tone'
import Shake from 'shake.js'
import Vue from 'vue'
import { mapState, mapMutations, mapGetters } from 'vuex'
import { TweenMax } from 'gsap/TweenMax'

import { NoteFactory } from '@/store'

export default {
    name: 'Shape',

    data() {
        return {
            dots: [],
            lines: [],
            r: 22,
        }
    },

    computed: {
        ...mapState(['dot', 'dotActive', 'players', 'sampleActive', 'playing']),

        ...mapGetters(['bank', 'ndots']),

        imageHeight() {
            return 100
        },

        imageWidth() {
            return 100
        },
    },

    watch: {
        dot: function(newDot, oldDot) {
            this.reset(newDot, oldDot)
            this.update()
        },
    },

    created() {
        for (let i = 0; i < this.ndots; i++) {
            this.dots.push({
                x: 0,
                y: 0,
                image: '',
                isSmall: i % 2 === 1, // if is 'interbeat' (for lack of better term)
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
        ...mapMutations(['setDotActive', 'setNote']),

        init() {
            this.loop = new Tone.Loop(time => {
                const previousActiveDot = this.dotActive
                const idxDotActive = (this.dotActive + 1) % this.ndots
                this.setDotActive(idxDotActive)
                this.previousActiveDot = previousActiveDot
                const idx = this.dotActive
                const note = this.$store.state.notes[idx]
                this.$root.$emit('dotstep', { idx, note, time })
            }, '8n').start(0)

            this.update(false)
            this.initShake()
        },

        initShake() {
            new Shake({ threshold: 10, timeout: 1000 }).start()
        },

        shaked() {
            console.log('i got shaked')
            this.reset()
        },

        dotChanged({ idx, src, sample }) {
            // @NOTE: silently ignore event of offbeat when dots=2
            if (idx >= this.dots.length) return
            46
            Vue.set(this.dots[idx], 'image', src)
            Vue.set(this.dots[idx], 'sample', sample)
        },

        reset(newDot, oldDot) {
            const diff = newDot - oldDot
            const nlines = this.dot
            if (diff < 0) {
                const dotsToKeep = newDot * 2
                this.dots = this.dots.slice(0, dotsToKeep)
                this.lines = this.lines.slice(0, nlines)
            } else {
                const createNewDotsFrom = indexes => {
                    indexes.forEach(idx => {
                        this.dots.push({
                            x: this.dots[idx].x,
                            y: this.dots[idx].y,
                            image: '',
                            isSmall: this.dots.length % 2 === 1,
                        })
                    })
                }
                const createNewLinesFrom = pairs => {
                    pairs.forEach(pair => {
                        const idx1 = pair[0]
                        const idx2 = pair[1]
                        const x1 = this.dots[idx1].x
                        const y1 = this.dots[idx1].y
                        const x2 = this.dots[idx2].x
                        const y2 = this.dots[idx2].y
                        const x3 = (x1 + x2) / 2
                        const y3 = (y1 + y2) / 2
                        this.lines.push({
                            x1,
                            x2,
                            y1,
                            y2,
                            x3,
                            y3,
                        })
                    })
                }
                if (oldDot === 3 && newDot === 4) {
                    createNewDotsFrom([0, 0])
                    createNewLinesFrom([[6, 0]])
                } else if (oldDot === 2 && newDot == 3) {
                    createNewDotsFrom([0, 0])
                    createNewLinesFrom([[0, 4]])
                } else if (oldDot === 2 && newDot == 4) {
                    createNewDotsFrom([0, 0, 0, 0])
                    createNewLinesFrom([[2, 4], [4, 6]])
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
            // console.log('dotStepped', { idx, note, time })
            const { r } = this
            const dot = this.$refs[`dot-${idx}`]
            const animationSpeed = 0.08
            const originalR = idx % 2 === 1 ? 0.75 * this.r : this.r
            TweenMax.to(dot, animationSpeed, {
                attr: { r: r * 1.5 },
                onComplete: () => {
                    TweenMax.to(dot, animationSpeed, { attr: { r: originalR } })
                },
            })
            if (!note || note.sample === '') return
            const db = idx === 0 ? 0 : -6
            this.players[note.bank].volume.value = db
            this.players[note.bank].get(note.sample).start(time)
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
            const y4 = (y2 - y1) / 2 + y1

            const animationSpeed = 0.8

            const updateDot = (idx, x, y, animate = true) => {
                if (!animate) {
                    Vue.set(this.dots[idx], 'x', x)
                    Vue.set(this.dots[idx], 'y', y)
                } else {
                    TweenMax.to(this.dots[idx], animationSpeed, { x, y })
                }
            }
            const updateLine = (
                idx,
                x1,
                y1,
                x2,
                y2,
                x3 = (x1 + x2) / 2,
                y3 = (y1 + y2) / 2
            ) => {
                if (!this.lines[idx]) {
                    this.lines.splice(idx, 1, { x1, y1, x2, y2 })
                }
                if (!animate) {
                    Vue.set(this.lines[idx], 'x1', x1)
                    Vue.set(this.lines[idx], 'y1', y1)
                    Vue.set(this.lines[idx], 'x2', x2)
                    Vue.set(this.lines[idx], 'y2', y2)
                    Vue.set(this.lines[idx], 'x3', x3)
                    Vue.set(this.lines[idx], 'y3', y3)
                } else {
                    TweenMax.to(this.lines[idx], animationSpeed, {
                        x1,
                        y1,
                        x2,
                        y2,
                        x3,
                        y3,
                    })
                }
            }

            const ym = (y2 - y1) / 2 + y1
            switch (this.dot) {
                case 2:
                    updateDot(0, x3, y1, animate)
                    updateDot(1, x3 + rb / 4, ym, animate)
                    updateDot(2, x3, y2, animate)
                    updateDot(3, x3 - rb / 4, ym, animate)
                    // updateLine(0, x3, y1, x3, y2)
                    updateLine(0, x3, y1, x3, y2, x3 + rb / 2, ym)
                    updateLine(1, x3, y2, x3, y1, x3 - rb / 2, ym)
                    break

                case 3:
                    updateDot(0, x3, y3, animate)
                    updateDot(1, (x3 + x2) / 2, (y3 + y2) / 2, animate)
                    updateDot(2, x2, y2, animate)
                    updateDot(3, x3, y2, animate)
                    updateDot(4, x1, y2, animate)
                    updateDot(5, (x1 + x3) / 2, (y3 + y2) / 2, animate)
                    updateLine(0, x3, y3, x2, y2)
                    updateLine(1, x2, y2, x1, y2)
                    updateLine(2, x1, y2, x3, y3)
                    break

                case 4:
                default:
                    updateDot(0, x1, y1, animate)
                    updateDot(1, x3, y1, animate)
                    updateDot(2, x2, y1, animate)
                    updateDot(3, x2, y4, animate)
                    updateDot(4, x2, y2, animate)
                    updateDot(5, x3, y2, animate)
                    updateDot(6, x1, y2, animate)
                    updateDot(7, x1, y4, animate)
                    updateLine(0, x1, y1, x2, y1)
                    updateLine(1, x2, y1, x2, y2)
                    updateLine(2, x2, y2, x1, y2)
                    updateLine(3, x1, y2, x1, y1)
                    break
            }
        },

        click(idx) {
            if (!this.sampleActive) return
            const note = NoteFactory(this.bank.id, this.sampleActive.sample)
            this.setNote({ idx, note })
            this.$root.$emit('dotchange', {
                idx,
                ...note,
                src: document.querySelector('img.active').getAttribute('src'),
            })
        },

        drag() {},
    },
}
</script>

<style lang="scss">
svg {
    overflow: visible;
}

.shape {
    height: 100%;
    // width: 400px;
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
}
</style>
