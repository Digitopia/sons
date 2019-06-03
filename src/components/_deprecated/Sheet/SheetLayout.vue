<template>
    <div class="sheetContainer">
        <svg id="canvas">
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

            <!-- <g class="lines">
                <line
                    v-for="(line, idx) in lines"
                    :key="`line-${idx}`"
                    class="sheet-line"
                    v-bind="line"
                />
            </g> -->

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

            <!-- Notes and rests go here -->
            <slot></slot>
        </svg>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
    name: 'Sheet',

    props: {
        numerator: {
            type: Number,
            default: 3,
        },
    },

    data() {
        return {
            px: 30, // padding x
            py: 50, // padding y
            num: {
                x: null,
                y: null,
            },
            denom: {
                x: null,
                y: null,
            },
            nlines: 5,
            lines: [],
            labels: [],
        }
    },

    computed: {
        ...mapState(['dot', 'banks']),

        numChar: function() {
            switch (this.numerator) {
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

    created() {
        this.$root.$on('debouncedresize', this.resize)
    },

    mounted() {
        this.init()
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
        },
    },
}
</script>

<style lang="scss">
// @import '../../assets/styles/bravura-regular';
// @import '../../assets/styles/bravura-regular';

.sheetContainer {
    text-align: center;
    transition: all 0.4s ease;
    width: 100%;
    svg {
        width: 100%;
    }
}

.hide {
    opacity: 0;
}

.sheet-line {
    stroke: black;
    stroke-width: 1px;
}
.time-signature {
    font-family: 'bravuraregular';
    font-size: 30px;
}

text {
    // font-family: 'Courier New', Courier, monospace;
    font-family: 'Bravura';
}
</style>
