<template>
    <div id="sheetContainer">
        <svg id="sheet" charset="utf-8">
            <text
                id="numerator"
                class="time-signature"
                :x="num.x"
                :y="num.y"
                v-html="numChar"
            ></text>
            <text
                id="denominator"
                class="time-signature"
                :x="denom.x"
                :y="denom.y"
            >
                &#57476;
            </text>
        </svg>
    </div>
</template>

<script>
import { store } from '../store'
import Snap from 'snapsvg'

export default {
    name: 'Sheet',

    props: {
        numerator: {
            type: Number,
            required: true,
            validator: function(val) {
                return [2, 3, 4].indexOf(val) !== -1
            },
        },
    },

    data() {
        return {
            state: store.state,
            segments: [],
            r: 25,
            lines: [],
            px: 30, // padding x
            py: 50, // padding y
            num: {
                x: null,
                y: null,
                val: this.numerator,
            },
            denom: {
                x: null,
                y: null,
            },
            dots: [],
        }
    },

    computed: {
        numChar: function() {
            switch (this.num.val) {
                case 2:
                    return '&#57474;'
                case 3:
                    return '&#57475;'
                case 4:
                default:
                    return '&#57476;'
            }
        },
    },

    watch: {
        'state.dot': function() {
            this.num.val = this.state.dot
        },
    },

    mounted() {
        this.init()
        this.$root.$on('dotchange', this.dotChanged)
        this.$root.$on('dotschange', this.dotsChanged)
        this.$root.$on('dotstep', this.dotStepped)

        // listener to fake stuff
        this.$on('dotchange', this.dotChanged)
    },

    methods: {
        init() {
            this.snap = Snap('#sheet')

            const w =
                this.snap.node.clientWidth ||
                this.snap.node.getBoundingClientRect().width
            const h =
                this.snap.node.clientHeight ||
                this.snap.node.getBoundingClientRect().height
            const px = this.px
            const py = this.py
            const x1 = px
            const x2 = w - px

            // Draw lines
            const n = 5
            const ys = []
            for (let i = 0; i < n; i += 1) {
                const y = py + ((h - 2 * py) / (n - 1)) * i
                ys.push(y)
                const line = this.snap.line(x1, y, x2, y).addClass('sheet-line')
                this.lines.push(line)
            }

            // Draw labels
            const xt = x2 + px / 4
            this.snap.text(xt, ys[0] + 5, 'A')
            this.snap.text(xt, ys[2] + 5, 'M')
            this.snap.text(xt, ys[4] + 5, 'G')

            // Position num and denom
            const ym = ys[2]
            const tsx =
                px / 2 - this.snap.select('#numerator').getBBox().width / 2 // time signature x
            const offset = 12 // offset from ym
            this.num.x = tsx
            this.num.y = ym - offset
            this.denom.x = tsx
            this.denom.y = ym + offset

            this.initDots()
        },

        initDots() {
            const padDot = 10
            this.dotRadius = 10
            this.dotCoef = 1.5

            const xmin = this.px + padDot
            const xmax = this.snap.node.getBoundingClientRect().width - this.px

            for (let idx = 0; idx < this.state.dot; idx++) {
                // circle
                const x = this.distribute(xmin, xmax, this.state.dot, idx)
                const y =
                    this.snap.node.getBoundingClientRect().height -
                    this.dotRadius * 1.5
                const circle = this.snap
                    .circle(x, y, this.dotRadius)
                    .attr('class', 'dot inactive')

                // empty image
                const r = this.dotRadius
                const imgx = x - (r * this.dotCoef) / 2
                const imgy = y - (r * this.dotCoef) / 2
                const imgw = r * this.dotCoef
                const imgh = r * this.dotCoef
                const image = this.snap.image('', imgx, imgy, imgw, imgh)
                this.dots.push({ circle, image })
            }
        },

        dotChanged(evt) {
            console.log('sheet dotchange', evt)

            const dot = this.dots[evt.idx]

            dot.circle.removeClass('inactive')

            // update image
            dot.image.attr('xlink:href', evt.src)

            // update height position
            const bank = this.state.banks.find(bank => bank.id === evt.bank)
            const register = bank.sounds.find(
                sound => sound.sample === evt.sample
            ).register
            let lineIdx
            if (register === 'agudos') lineIdx = 0
            if (register === 'medios') lineIdx = 2
            if (register === 'graves') lineIdx = 4
            const y = Number.parseInt(this.lines[lineIdx].attr('y1'))
            dot.circle.attr('cy', y)
            dot.image.attr('y', y - (this.dotCoef * this.dotRadius) / 2)
        },

        dotsChanged(diff) {
            console.log('sheet dotschanged')
            for (let i = 0; i < Math.abs(diff); i++) {
                const srcs = this.dots.map(dot => dot.image.attr('xlink:href'))
                this.reset()
                this.initDots()
                this.state.dots.forEach((dot, idx) => {
                    const src = srcs[idx]
                    if (dot.sample == '' || dot.bank == '') return
                    this.$emit('dotchange', {
                        idx,
                        ...this.state.dots[idx],
                        src,
                    })
                })
            }
        },

        dotStepped({ idx }) {
            this.dots[idx].circle.animate(
                { r: this.dotRadius * 1.5, strokeWidth: 3 },
                80,
                window.mina.easinout,
                () => {
                    this.dots[idx].circle.animate(
                        { r: this.dotRadius, stroke: 'none' },
                        80
                    )
                }
            )
        },

        /**
         * This is a temporary function until animation between dotsChanged is implemented.
         * For now just throw everything away and rebuild from state
         */
        reset() {
            this.dots.forEach(dot => {
                dot.image.remove()
                dot.circle.remove()
            })
            this.dots = []
        },

        resize() {
            // TODO:
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

<style lang="scss">
@import '../styles/bravura-regular';

#sheetContainer {
    grid-area: sheet;
    text-align: center;
    transition: all 0.4s ease;
    width: 100%;
    svg {
        width: 100%;
    }
}

.hide {
    opacity: 0;
    // transform: translateY(200%);
}

.sheet-line {
    stroke: black;
    stroke-width: 1px;
}
.time-signature {
    font-family: 'bravuraregular';
    font-size: 30px;
}
.inactive {
    opacity: 0.4;
}

text {
    font-weight: bold;
}
</style>
