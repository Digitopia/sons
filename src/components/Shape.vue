<template>
  <div id="shape">
    <svg
      id="svg"
      width="100%"
      height="100%"
    />
  </div>
</template>

<script>
import Snap from 'snapsvg'
import app from '../App.vue'
import { store } from '../store'
import Tone from 'tone'
import Shake from 'shake.js'

export default {
    name: 'Shape',
    data() {
        return {
            segments: [],
            r: 25,
            group: undefined,
            snap: undefined,
            sequence: undefined,
            shared: store.state
        }
    },
    computed: {
        dot: function() {
            return store.state.dot
        },
        dots: function() {
            return store.state.dots
        }
    },
    watch: {
        dot: function() {
            this.draw()
            this.$root.$emit('sample-changed')
            this.resetSequence()
            this.sequence.start(0)
        }
    },
    mounted() {
        new Shake({ threshold: 10, timeout: 1000 }).start()
        window.addEventListener(
            'shake',
            () => {
                this.$root.$emit('shaked')
            },
            false
        )
        this.snap = Snap('#svg')
        this.resetSequence()
        this.sequence.start(0)
        this.draw()
        this.$root.$on('soundbank-change', bankid => {
            this.reset()
            this.$root.$emit('soundbank-change-next')
        })
        this.$root.$on('custom-resize', this.resize)
        this.$root.$on('shaked', () => {
            this.reset()
            Tone.Transport.stop()
            this.$root.$emit('stop')
            this.$root.$emit('soundbank-change-next')
        })
        this.$root.$on('chosen-dot', idx => {
            const img = document.querySelector('img.active')
            if (!img) return
            const sample = img.getAttribute('data-sample')
            const src = img.src
            this.setSample(sample, src, idx)
        })
    },
    methods: {
        reset() {
            store.resetDots()
            this.resetSequence()
            this.sequence.start(0)
            this.draw()
        },
        resize() {
            const isMobile = 'ontouchstart' in document.documentElement
            if (isMobile) return
            this.draw()
        },
        resetSequence() {
            if (this.sequence) this.sequence.dispose()
            this.sequence = new Tone.Sequence(
                this.playSample,
                new Array(this.dot).fill(''),
                '4n'
            )
        },
        playSample(time, note) {
            this.dots.forEach(dot => dot.removeClass('active'))

            let idx = this.sequence.progress * this.dot
            idx = Math.round(idx) // HACK: this is a dangerous fix!
            // console.log('idx', idx, this.sequence.progress.toFixed(2));

            // animate shape dot
            if (!this.dots[idx]) return
            this.dots[idx].animate(
                { r: this.r * 1.5 },
                80,
                window.mina.easinout,
                () => {
                    this.dots[idx].animate({ r: this.r }, 80)
                }
            )

            // animate sheet dot
            const sheetRadius = 12
            if (!this.dots[idx].sheetElem) return
            this.dots[idx].sheetElem.animate(
                { r: sheetRadius * 1.5, strokeWidth: 3 },
                80,
                window.mina.easinout,
                () => {
                    this.dots[idx].sheetElem.animate(
                        { r: sheetRadius, stroke: 'none' },
                        80
                    )
                }
            )

            if (note === '') return
            const players = this.shared.players
            const bankId = this.shared.bankId
            const player = players[bankId]
            player.get(note).start(time)
            // this.shared.players[this.shared.bankId].get(note).start(time);
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

            if (this.dot === 2) {
                const s = this.snap.line(x3, y1, x3, y2)
                const d1 = this.snap.circle(x3, y1, r)
                const d2 = this.snap.circle(x3, y2, r)
                this.dots.push(...[d1, d2])
                this.segments.push(s)
                this.group = this.snap.group(s, d1, d2)
            } else if (this.dot === 3) {
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
            } else if (this.dot === 4) {
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
                    this.$root.$emit('chosen-dot', idx)
                })
                dot.image.appendTo(this.snap)
            })
            this.segments.forEach(segment => segment.addClass('segment'))
            this.segments.forEach(segment =>
                segment.attr({
                    stroke: 'black',
                    strokeWidth: '12px'
                })
            )
        },
        dragover(evt) {
            evt.preventDefault()
        },
        setSample(sample, src, idx) {
            this.dots[idx].image.attr({ 'xlink:href': src })
            this.dots[idx].sample = sample
            this.sequence.at(idx, sample)
            this.$root.$emit('sample-changed')
        },
        drop(evt) {
            evt.preventDefault()
            const sample = evt.dataTransfer.getData('sample')
            const src = evt.dataTransfer.getData('src')
            const idx = evt.target.getAttribute('data-dot')
            this.setSample(sample, src, idx)
        }
    }
}
</script>

<style lang="scss">
#shape {
  grid-area: shape;
  width: 300px;
  height: 300px;
  // height: 100%;
  image:hover {
    cursor: pointer;
  }
}
.dot {
  fill: var(--accent);
}
</style>
