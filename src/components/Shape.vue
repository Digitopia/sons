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
                        :cx="dot.x"
                        :cy="dot.y"
                        :data-dot="idx"
                        :r="r"
                        class="dot animated"
                        :class="{ active: idx === dotActive }"
                        @click.prevent.stop="click(idx)"
                        @dragover="dragover"
                        @drop="click($event, idx)"
                    ></circle>

                    <!-- Label dots for debug purposes -->
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

        ...mapGetters(['bank']),
    },

    watch: {
        dot: function(newDot, oldDot) {
            this.reset(newDot, oldDot)
            this.update()
        },
    },

    created() {
        for (let i = 0; i < this.dot; i++) {
            this.dots.push({
                x: 0,
                y: 0,
                image: '',
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
                this.setDotActive((this.dotActive + 1) % this.dot)
                const idx = this.dotActive
                const note = this.$store.state.notes[idx]
                this.$root.$emit('dotstep', { idx, note, time })
            }, '4n').start(0)

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
            // prettier-ignore
            const nlines = this.dot === 4 || this.dot === 3 ? this.dot : 1
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
                    createNewDotFrom(0)
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
            console.log('shape dotstepped', idx, note, time)
            const r = this.r
            const dot = this.$el.querySelectorAll('.dot')[idx]
            console.log('dot is', dot, r)
            const animationSpeed = 0.08
            TweenMax.to(dot, animationSpeed, {
                attr: { r: r * 1.5 },
                onComplete: () => {
                    TweenMax.to(dot, animationSpeed, { attr: { r } })
                },
            })
            console.log('Note is', note)
            if (note.sample === '') return
            console.log(note)
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

        dragover(e) {
            e.preventDefault()
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
}
</style>
