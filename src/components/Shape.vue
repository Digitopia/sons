<template>
    <div class="shape" @shake="shaked">
        <svg id="svg" width="100%" height="100%">
            <g class="lines">
                <line
                    v-for="(line, idx) in lines"
                    :key="idx"
                    v-bind="line"
                    stroke="black"
                    stroke-width="10"
                    class="line animated fadeIn slow"
                />
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
                        @dragover.prevent.stop="drag"
                        @drop.prevent="click(idx)"
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
                    />
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

        // TODO: will it work with @ notation?
        this.$root.$on('dotchange', this.dotChanged)
        this.$root.$on('dotstep', this.dotStepped)
        this.$root.$on('dotsclear', this.clear)
    },

    methods: {
        ...mapMutations(['setDotActive', 'setNote']),

        init() {
            this.loop = new Tone.Loop(time => {
                const previousActiveDot = this.dotActive

                let idxDotActive

                if (this.dot === 2) {
                    console.log('this.dot is 2')
                    if (this.dotActive === 1) {
                        if (this.previousActiveDot === 0) idxDotActive = 2
                        else idxDotActive = 0
                    } else if (this.dotActive === 2) idxDotActive = 1
                    else idxDotActive = (this.dotActive + 1) % this.ndots
                } else {
                    idxDotActive = (this.dotActive + 1) % this.ndots
                }

                console.log({ idxDotActive })
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
            Vue.set(this.dots[idx], 'image', src)
            Vue.set(this.dots[idx], 'sample', sample)
        },

        reset(newDot, oldDot) {
            const diff = newDot - oldDot
            const nlines = this.dot === 4 || this.dot === 3 ? this.dot : 1
            if (diff < 0) {
                const dotsToKeep = newDot == 2 ? 3 : newDot * 2
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
                        this.lines.push({
                            x1: this.dots[idx1].x,
                            y1: this.dots[idx1].y,
                            x2: this.dots[idx2].x,
                            y2: this.dots[idx2].y,
                        })
                    })
                }
                if (oldDot === 3 && newDot === 4) {
                    createNewDotsFrom([0, 0])
                    createNewLinesFrom([[6, 0]])
                } else if (oldDot === 2 && newDot == 3) {
                    createNewDotsFrom([2, 2, 1])
                    createNewLinesFrom([[2, 4], [2, 0]])
                } else if (oldDot === 2 && newDot == 4) {
                    createNewDotsFrom([2, 2, 2, 2, 2])
                    createNewLinesFrom([[2, 4], [4, 6], [6, 2]])
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
            console.log('dotStepped', idx)
            const r = this.r
            const dot = this.$refs[`dot-${idx}`]
            const animationSpeed = 0.08
            const originalR = this.dots[idx].isSmall ? 0.75 * this.r : this.r
            TweenMax.to(dot, animationSpeed, {
                attr: { r: r * 1.5 },
                onComplete: () => {
                    TweenMax.to(dot, animationSpeed, { attr: { r: originalR } })
                },
            })
            if (note.sample === '') return
            if (idx === 0) this.players[note.bank].volume.value = 0
            else if (idx % 2 === 0) this.players[note.bank].volume.value = -6
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
                    TweenMax.to(this.lines[idx], animationSpeed, {
                        x1,
                        y1,
                        x2,
                        y2,
                    })
                }
            }

            switch (this.dot) {
                case 2:
                    updateDot(0, x3, y1, animate)
                    updateDot(2, x3, y2, animate)
                    updateDot(1, x3, (y2 - y1) / 2 + y1, animate)
                    updateLine(0, x3, y1, x3, y2)
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
