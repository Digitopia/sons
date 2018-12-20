<template>
    <div id="sheetContainer">
        <svg id="sheet" charset="utf-8">
            <g class="time-signature">
                <text
                    id="numerator"
                    ref="numerator"
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
            </g>

            <g class="lines">
                <line
                    v-for="(line, idx) in lines"
                    :key="`line-${idx}`"
                    class="sheet-line"
                    :x1="line.x1"
                    :y1="line.y1"
                    :x2="line.x2"
                    :y2="line.y2"
                />
            </g>

            <g class="labels">
                <text
                    v-for="(label, idx) in labels"
                    :key="`label-${idx}`"
                    :x="label.x"
                    :y="label.y"
                >
                    {{ label.text }}
                </text>
            </g>

            <g v-for="(dot, idx) in dots" :key="`dot-${idx}`" class="dots">
                <circle
                    :cx="dot.x"
                    :cy="dot.y"
                    :r="r"
                    :class="{ inactive: dot.image === '' }"
                    class="dot"
                ></circle>
                <image
                    :href="dot.image"
                    :set="(factor = 0.8)"
                    :x="dot.x - r * factor"
                    :y="dot.y - r * factor"
                    :width="r * 2 * factor"
                />
            </g>
        </svg>
    </div>
</template>

<script>
import Vue from 'vue'
import { store } from '../store'

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
            r: 10,
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
            nlines: 5,
            lines: [],
            dots: [],
            labels: [],
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
        'state.dot': function(newDot, oldDot) {
            this.num.val = this.state.dot
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
                register: '',
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
            const w = this.$el.clientWidth
            const h = this.$el.clientHeight
            const px = this.px
            const py = this.py
            const x1 = px
            const x2 = w - px

            // Lines
            for (let i = 0; i < this.nlines; i += 1) {
                const y = py + ((h - 2 * py) / (this.nlines - 1)) * i
                this.lines.push({ x1, x2, y1: y, y2: y })
            }

            // Labels
            const labelX = x2 + px / 4
            this.labels.push({
                x: labelX,
                y: this.lines[0].y1 + 5,
                text: 'A',
            })
            this.labels.push({
                x: labelX,
                y: this.lines[2].y1 + 5,
                text: 'M',
            })
            this.labels.push({
                x: labelX,
                y: this.lines[4].y1 + 5,
                text: 'G',
            })

            // Time Signature
            const ym = this.lines[2].y1
            const timeSignatureX = px / 2 - this.$refs.numerator.clientWidth / 2
            const offset = 12 // offset from ym
            this.num.x = timeSignatureX
            this.num.y = ym - offset
            this.denom.x = timeSignatureX
            this.denom.y = ym + offset

            this.update()
        },

        update() {
            const padDot = 10

            const xmin = this.px + padDot
            const xmax = this.$el.clientWidth - this.px

            for (let i = 0; i < this.state.dot; i++) {
                const x = this.distribute(xmin, xmax, this.state.dot, i)
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
                console.log('dot.register', dot.register)
                if (dot.register === 'agudos') lineIdx = 0
                if (dot.register === 'medios') lineIdx = 2
                if (dot.register === 'graves') lineIdx = 4
                console.log(this.lines)
                ret = this.lines[lineIdx].y1
            } else {
                ret = this.$el.clientHeight - this.r * 1.5
            }
            return ret
        },

        dotChanged(evt) {
            console.log('sheet dotchange', evt)

            // update height position
            const bank = this.state.banks.find(bank => bank.id === evt.bank)
            const register = bank.sounds.find(
                sound => sound.sample === evt.sample
            ).register

            Vue.set(this.dots[evt.idx], 'register', register)

            const y = this.getRegisterY(this.dots[evt.idx])
            this.updateDot(evt.idx, this.dots[evt.idx].x, y)
            Vue.set(this.dots[evt.idx], 'image', evt.src)
        },

        dotStepped({ idx }) {
            // snap version
            // this.dots[idx].circle.animate(
            //     { r: this.dotRadius * 1.5, strokeWidth: 3 },
            //     80,
            //     window.mina.easinout,
            //     () => {
            //         this.dots[idx].circle.animate(
            //             { r: this.dotRadius, stroke: 'none' },
            //             80
            //         )
            //     }
            // )
            // this.dots[idx].r = this.dots[idx].r * 2
            // Vue.set(this.dots[idx], 'r', this.dots[idx].r * 2)
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
