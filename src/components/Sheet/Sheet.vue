<template>
    <SheetLayout ref="SheetLayout" :numerator="dot">
        <g v-for="(dot, index) in dots" :key="`dot-${index}`" class="dots">
            <!-- Plain Circle version -->
            <!-- <circle
                :cx="dot.x"
                :cy="dot.y"
                :r="r"
                :class="{ inactive: dot.image === '' }"
                class="dot"
            ></circle> -->

            <SheetRest
                v-if="dot.image === ''"
                :x="dot.x"
                :y="dot.y"
                class="dot"
            />

            <SheetNote
                v-else
                :x="dot.x - 20"
                :y="dot.y - 60"
                :disabled="dot.image === ''"
                class="dot"
            />

            <image
                v-bind="{ 'xlink:href': dot.image }"
                :set="(factor = 0.8)"
                :x="dot.x - r * factor + 2"
                :y="dot.y - r * factor + 2.5"
                :width="r * 2 * factor"
                :height="r * 2 * factor"
            />
        </g>
    </SheetLayout>
</template>

<script>
import Vue from 'vue'
import { TweenMax } from 'gsap/TweenMax'

import SheetLayout from './SheetLayout'
import SheetNote from './SheetNote'
import SheetRest from './SheetRest'

import { mapState, mapGetters } from 'vuex'

export default {
    components: {
        SheetLayout,
        SheetNote,
        SheetRest,
    },

    data() {
        return {
            dots: [],
            r: 10,
            px: 30,
        }
    },

    computed: {
        ...mapState(['dot', 'banks']),

        ...mapGetters(['bank']),
    },

    watch: {
        dot: function(newDot, oldDot) {
            const diff = newDot - oldDot
            this.reset(diff)
            this.update()
        },
    },

    created() {
        for (let i = 0; i < this.dot; i++) {
            this.dots.push({
                x: 0,
                y: 0,
                image: '',
                register: '',
            })
        }

        this.$root.$on('dotchange', this.dotChanged)
        this.$root.$on('dotstep', this.dotStepped)
        this.$root.$on('dotsclear', this.clear)
    },

    mounted() {
        this.update()
    },

    methods: {
        update() {
            const padDot = 10

            const xmin = this.px + padDot
            const xmax = this.$el.clientWidth - this.px

            for (let i = 0; i < this.dot; i++) {
                const x = this.distribute(xmin, xmax, this.dot, i)
                const y = this.getRegisterY(this.dots[i])
                this.updateDot(i, x, y)
            }
        },

        updateDot(idx, x, y) {
            Vue.set(this.dots[idx], 'x', x)
            Vue.set(this.dots[idx], 'y', y)
        },

        getRegisterY(dot) {
            let ret
            if ('register' in dot && dot.register !== '') {
                let lineIdx
                if (dot.register === 'agudos') lineIdx = 0
                if (dot.register === 'medios') lineIdx = 2
                if (dot.register === 'graves') lineIdx = 4
                ret = this.$refs.SheetLayout.lines[lineIdx].y1
            } else {
                ret = this.$el.clientHeight - this.r * 1.5
            }
            return ret
        },

        dotChanged(evt) {
            const bank = this.banks.find(bank => bank.id === evt.bank)
            const register = bank.sounds.find(
                sound => sound.sample === evt.sample
            ).register

            Vue.set(this.dots[evt.idx], 'register', register)

            const y = this.getRegisterY(this.dots[evt.idx])
            this.updateDot(evt.idx, this.dots[evt.idx].x, y)
            Vue.set(this.dots[evt.idx], 'image', evt.src)
        },

        dotStepped({ idx }) {
            const r = this.r
            const dot = this.$el.querySelectorAll('.dot')[idx]
            const animationSpeed = 0.08
            TweenMax.to(dot, animationSpeed, {
                attr: { r: r * 1.5 },
                onComplete: () => {
                    TweenMax.to(dot, animationSpeed, { attr: { r } })
                },
            })
        },

        reset(diff) {
            for (let i = 0; i < Math.abs(diff); i++) {
                if (diff < 0) {
                    this.dots.pop()
                } else {
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
                dot.register = ''
            })
            this.update()
        },

        resize() {
            this.lines = []
            this.labels = []
            this.init()
        },

        distribute(vmin, vmax, steps, idx) {
            if (steps === 0)
                throw Error(`steps cannot be 0 and ${steps} was used.`)
            if (idx >= steps)
                throw Error(
                    `idx has to be less than steps and idx was ${idx} and steps was ${steps}.`
                )
            if (vmin > vmax)
                throw Error(
                    `vmin has to be less than vmax and vmin was ${vmin} and vmax was ${vmax}`
                )
            const step = (vmax - vmin) / (steps * 2)
            return vmin + step * idx * 2 + step
        },
    },
}
</script>

<style>
.inactive {
    opacity: 0.4;
}
</style>
