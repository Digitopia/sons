<template>
    <div id="shape"><svg id="svg" width="100%" height="100%" /></div>
</template>

<script>
import Snap from 'snapsvg'
import { store } from '../store'
import Tone from 'tone'
import Shake from 'shake.js'

export default {
    name: 'Shape',
    data() {
        return {
            state: store.state,
            segments: [],
            r: 25,
            snap: null,
            dots: [],
        }
    },
    watch: {},
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
            this.snap = Snap('#svg')

            this.loop = new Tone.Loop(time => {
                const idx = this.state.dotActive
                const note = this.state.dots[idx]
                this.$root.$emit('dotstep', { idx, note, time })
                this.state.dotActive =
                    (this.state.dotActive + 1) % this.state.dot
            }, '4n').start(0)

            this.draw()

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
            this.dots[dot.idx].image.attr({ 'xlink:href': dot.src })
            this.dots[dot.idx].sample = dot.sample
        },

        dotsChanged(diff) {
            for (let i = 0; i < Math.abs(diff); i++) {
                const srcs = this.dots.map(dot => dot.image.attr('xlink:href'))
                this.reset()
                this.draw()
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

        resize() {
            this.draw()
        },

        /**
         * This is a temporary function until animation between dotsChanged is implemented.
         * For now just throw everything away and rebuild from state
         */
        reset() {
            this.dots.forEach(dot => {
                if (dot.image) dot.image.remove()
                dot.remove()
            })
            this.dots = []

            this.segments.forEach(segment => {
                segment.remove()
            })
        },

        dotStepped({ idx, note, time }) {
            this.dots.forEach(dot => dot.removeClass('active'))

            // animate
            if (!this.dots[idx]) return
            this.dots[idx].animate(
                { r: this.r * 1.5 },
                80,
                window.mina.easinout,
                () => {
                    this.dots[idx].animate({ r: this.r }, 80)
                }
            )

            if (note.bank === '' || note.sample == '') return
            this.state.players[note.bank].get(note.sample).start(time)
        },

        draw() {
            this.snap.clear()

            const w =
                this.snap.node.clientWidth ||
                this.snap.node.getBoundingClientRect().width
            const h =
                this.snap.node.clientHeight ||
                this.snap.node.getBoundingClientRect().height

            const { r } = this
            const padding = r * 0.5
            const x1 = r + padding
            const x2 = w - padding - r
            const x3 = w / 2
            const rb = x2 - x1
            const y1 = x1
            const y2 = h - padding - r
            const y3 = y2 - Math.sqrt(rb ** 2 - (rb / 2) ** 2)

            if (this.state.dot === 2) {
                const s = this.snap.line(x3, y1, x3, y2)
                const d1 = this.snap.circle(x3, y1, r)
                const d2 = this.snap.circle(x3, y2, r)
                this.dots.push(...[d1, d2])
                this.segments.push(s)
                this.group = this.snap.group(s, d1, d2)
            } else if (this.state.dot === 3) {
                const s1 = this.snap.line(x3, y3, x2, y2)
                const s2 = this.snap.line(x2, y2, x1, y2)
                const s3 = this.snap.line(x1, y2, x3, y3)
                const d1 = this.snap.circle(x3, y3, r)
                const d2 = this.snap.circle(x2, y2, r)
                const d3 = this.snap.circle(x1, y2, r)
                this.dots.push(...[d1, d2, d3])
                this.segments.push(...[s1, s2, s3])
                this.group = this.snap.group(s1, s2, s3, d1, d2, d3)
                const tx = (y3 - (h - y2)) / 2
                this.snap.transform(`translate(0 ${-tx})`)
            } else if (this.state.dot === 4) {
                const s1 = this.snap.line(x1, y1, x2, y1)
                const s2 = this.snap.line(x2, y1, x2, y2)
                const s3 = this.snap.line(x2, y2, x1, y2)
                const s4 = this.snap.line(x1, y2, x1, y1)
                const d1 = this.snap.circle(x1, y1, r)
                const d2 = this.snap.circle(x2, y1, r)
                const d3 = this.snap.circle(x2, y2, r)
                const d4 = this.snap.circle(x1, y2, r)
                this.group = this.snap.group(s1, s2, s3, d4, d1, d2, d3, d4)
                this.dots.push(...[d1, d2, d3, d4])
                this.segments.push(...[s1, s2, s3, s4])
            }

            this.dots.forEach((dot, idx) => {
                dot.attr({ 'data-dot': idx })
                dot.addClass('dot')
                dot.sample = ''
                dot.image = this.snap
                    .image('', dot.attr('cx') - 20, dot.attr('cy') - 20, 40, 40)
                    .attr({ 'data-dot': idx })

                dot.node.addEventListener('dragover', this.dragover)
                dot.node.addEventListener('drop', this.drop)
                dot.image.node.addEventListener('dragover', this.dragover)
                dot.image.node.addEventListener('drop', this.drop)
                dot.image.node.addEventListener('touchstart', () => {
                    // TODO: do something...
                })
                dot.image.appendTo(this.snap)
            })
            this.segments.forEach(segment => segment.addClass('segment'))
            this.segments.forEach(segment =>
                segment.attr({
                    stroke: 'black',
                    strokeWidth: '12px',
                })
            )
        },

        dragover(evt) {
            evt.preventDefault()
        },

        drop(evt) {
            evt.preventDefault()
            const idx = Number.parseInt(evt.target.getAttribute('data-dot'))
            const src = evt.dataTransfer.getData('src')
            const dot = {
                bank: this.state.bank.id,
                sample: evt.dataTransfer.getData('sample'),
            }
            this.state.dots[idx] = dot
            this.$root.$emit('dotchange', { idx, ...dot, src })
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
        cursor: pointer;
    }
}
.dot {
    fill: var(--accent);
}
</style>
