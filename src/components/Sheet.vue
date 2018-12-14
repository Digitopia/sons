<template>
    <div id="sheetContainer" :class="{hide: !shared.showSheet}">
        <svg id="sheet" charset="utf-8">
            <text id="numerator" class="time-signature" :x="num.x" :y="num.y" v-html="numChar"></text>
            <text id="denominator" class="time-signature" :x="denom.x" :y="denom.y">&#57476;</text>
        </svg>
    </div>
</template>

<script>
import { store } from '../store';
import Snap from 'snapsvg';

export default {
    name: 'Sheet',
    props: {
        numerator: {
            type: Number,
            default: 2
        }
    },
    data() {
        return {
            segments: [],
            r: 25,
            group: undefined,
            lines: [],
            px: 30, // padding x
            py: 50, // padding y
            num: {
                x: undefined,
                y: undefined,
                val: this.numerator
            },
            denom: {
                x: undefined,
                y: undefined
            },
            shared: store.state
        };
    },
    watch: {
        dot: function() {
            this.num.val = this.dot;
        }
    },
    computed: {
        dot: function() {
            return store.state.dot;
        },
        dots: function() {
            return store.state.dots;
        },
        numChar: function() {
            switch (this.num.val) {
                case 2:
                    return '&#57474;';
                case 3:
                    return '&#57475;';
                case 4:
                default:
                    return '&#57476;';
            }
        }
    },
    created() {
        this.$root.$on('sample-changed', () => {
            this.draw();
        });
        this.$root.$on('soundbank-change-next', () => {
            this.draw();
        });
    },
    mounted() {
        this.snap = Snap('#sheet');
        // this.snap.node.setAttribute('viewBox', '0 0 100 100');
        // this.$root.$on('custom-resize', this.resize);
        this.init();
    },
    methods: {
        resize() {
            this.snap.clear();
            this.init();
        },
        reset() {
            this.dots.forEach(dot => {
                if (dot.sheetImage) dot.sheetImage.remove();
                if (dot.sheetElem) {
                    dot.sheetElem.remove();
                }
            });
        },
        init() {
            const w =
                this.snap.node.clientWidth ||
                this.snap.node.getBoundingClientRect().width;
            const h =
                this.snap.node.clientHeight ||
                this.snap.node.getBoundingClientRect().height;
            const px = this.px;
            const py = this.py;
            const x1 = px;
            const x2 = w - px;

            // Draw lines
            const n = 5;
            const ys = [];
            for (let i = 0; i < n; i += 1) {
                const y = py + ((h - 2 * py) / (n - 1)) * i;
                ys.push(y);
                const line = this.snap
                    .line(x1, y, x2, y)
                    .addClass('sheet-line');
                this.lines.push(line);
            }

            // Draw labels
            const xt = x2 + px / 4;
            this.snap.text(xt, ys[0] + 5, 'A');
            this.snap.text(xt, ys[2] + 5, 'M');
            this.snap.text(xt, ys[4] + 5, 'G');

            // Position num and denom
            const y1 = (ys[2] + ys[0]) / 2;
            const ym = ys[2];
            const y2 = (ys[3] + ys[2]) / 2;
            const tsx =
                px / 2 - this.snap.select('#numerator').getBBox().width / 2; // time signature x
            const offset = 12; // offset from ym
            this.num.x = tsx;
            this.num.y = ym - offset;
            this.denom.x = tsx;
            this.denom.y = ym + offset;

            this.draw();
        },

        draw() {
            this.reset();

            const px = this.px;
            const padDot = 10;
            this.dotRadius = 8;

            const xmin = this.px + padDot;
            const xmax = this.snap.node.getBoundingClientRect().width - this.px;

            this.dots.forEach((dot, idx) => {
                const x = this.distribute(xmin, xmax, this.dots.length, idx);
                let y;
                if (dot.sample === '') {
                    y =
                        this.snap.node.getBoundingClientRect().height -
                        this.dotRadius * 1.5;
                } else {
                    const reg = this.getSoundRegister(dot.sample);
                    let lineIdx;
                    if (reg === 'agudos') lineIdx = 0;
                    else if (reg === 'medios') lineIdx = 2;
                    else if (reg === 'graves') lineIdx = 4;
                    y = this.lines[lineIdx].attr('y1');
                }
                const d = this.snap.circle(x, y, this.dotRadius);
                d.addClass('dot');
                const src = dot.image.attr('xlink:href');
                const r = this.dotRadius;
                const coeff = 1.5;

                const imgx = x - (r * coeff) / 2;
                const imgy = y - (r * coeff) / 2;
                const imgw = r * coeff;
                const imgh = r * coeff;
                const img = this.snap.image(src, imgx, imgy, imgw, imgh);
                dot.sheetElem = d;
                if (dot.sample === '') dot.sheetElem.addClass('inactive');
                dot.sheetImage = img;
            });
        },

        getSoundRegister(sound) {
            const registers = Object.keys(store.getActiveBank().sounds);
            const sounds = store.getActiveBank().sounds;
            for (let iregister = 0; iregister < registers.length; iregister++) {
                const register = registers[iregister];
                const rsounds = sounds[register];
                for (let isound = 0; isound < rsounds.length; isound += 1) {
                    const s = rsounds[isound];
                    if (s.sample === sound) return register;
                }
            }
            // registers.forEach(register => {
            //     const sound = register.sounds.find(s => s.sample === sound);
            //     if (sound) return register;
            // });
            console.log('!!!!!!!!!!! returning sound register error');
            return 'graves';
        },

        distribute(vmin, vmax, steps, idx) {
            if (steps === 0)
                throw Error(`steps cannot be 0 and ${steps} was used.`);
            if (idx >= steps)
                throw Error(
                    `idx has to be less than steps and idx was ${idx} and steps was ${steps}.`
                );
            if (vmin > vmax)
                throw Error(
                    `vmin has to be less than vmax and vmin was ${vmin} and vmax was ${vmax}`
                );
            const step = (vmax - vmin) / (steps * 2);
            return vmin + step * idx * 2 + step;
        }
    }
};
</script>

<style lang="scss">
#sheetContainer {
    // grid-column: 1 / -1;
    // grid-column: 2 / 3;
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

@font-face {
    font-family: "bravuraregular";
    src: url(data:application/font-woff2;charset=utf-8;base64,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)
            format("woff2"),
        url(data:application/font-woff;charset=utf-8;base64,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)
            format("woff");
    font-weight: normal;
    font-style: normal;
}
.sheet-line {
    stroke: black;
    stroke-width: 1px;
}
.time-signature {
    font-family: "bravuraregular";
    font-size: 30px;
}
.inactive {
    opacity: 0.4;
}

text {
    font-weight: bold;
}
</style>
